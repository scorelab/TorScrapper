import time
import calendar
import shutil
from math import fsum
from datetime import datetime
from dateutil import tz
from sets import Set
from itertools import product
from signal import SIGTERM
import shlex
from pprint import pprint
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import scipy as sp
import numpy as np
from random import random, randint, sample
from subprocess import Popen
from subprocess import PIPE
import linecache
from sys import exc_info
from os import chdir, listdir, environ, makedirs, rename, chmod, walk, remove
from os.path import isfile, join, exists, isdir
from elasticsearch import Elasticsearch
from seeds_generator.download import callDownloadUrls, getImage, getDescription
from seeds_generator.runSeedFinder import RunSeedFinder
from seeds_generator.concat_nltk import get_bag_of_words
from elastic.get_config import get_available_domains, get_mapping, get_tag_colors
from elastic.search_documents import get_context, term_search, search, range_search, multifield_term_search, multifield_query_search, field_missing, field_exists
from elastic.misc_queries import exec_query, random_sample
from elastic.add_documents import add_document, update_document, delete_document, refresh
from elastic.get_mtermvectors import getTermStatistics, getTermFrequency
from elastic.get_documents import (get_most_recent_documents, get_documents,
    get_all_ids, get_more_like_this, get_documents_by_id,
    get_plotting_data)
from elastic.aggregations import get_significant_terms, get_unique_values
from elastic.create_index import create_index, create_terms_index, create_config_index
from elastic.load_config import load_config
from elastic.delete_index import delete_index
from elastic.config import es, es_doc_type, es_server
from elastic.delete import delete
from ranking import tfidf, rank, extract_terms, word2vec, get_bigrams_trigrams
from online_classifier.online_classifier import OnlineClassifier
from online_classifier.tfidf_vector import tfidf_vectorizer
from online_classifier.tf_vector import tf_vectorizer
from concurrent.futures import ThreadPoolExecutor as Pool
import urllib2
MAX_TEXT_LENGTH = 3000
MAX_TERM_FREQ = 2
MAX_LABEL_PAGES = 2000
MAX_SAMPLE_PAGES = 500

class DomainModel(object):

  w2v = word2vec.word2vec(from_es=False)

  def __init__(self, path=""):
    self._es = None
    self._all = 100000
    self._termsIndex = "ddt_terms"
    self._pagesCapTerms = 100
    self._capTerms = 500
    self.projectionsAlg = {'Group by Similarity': self.pca,
                           'Group by Correlation': self.tsne
                         }
    self._predefined_tags = ["Deep Crawl"];

    create_config_index()
    create_terms_index()

    self._mapping = {"url":"url", "timestamp":"retrieved", "text":"text", "html":"html", "tag":"tag", "query":"query", "domain":"domain", "title":"title"}
    self._domains = None
    self._onlineClassifiers = {}
    self._classifiersCrawler = {}
    self._pos_tags = ['NN', 'NNS', 'NNP', 'NNPS', 'FW', 'JJ']
    self._path = path

    self.results_file = open("results.txt", "w")

    self.pool = Pool(max_workers=3)
    self.seedfinder = RunSeedFinder()
    self.runningSeedFinders={}
    self.extractTermsVectorizer = {}

    self._initACHE()

  
  

    def setPath(self, path):
    self._path = path

  def getPath(self, path):
    return self._path

  def setCrawlerModel(self, crawlerModel):
    self._crawlerModel = crawlerModel


  def stopProcess(self, process, process_info):
    print "Stop Process ",process," ",process_info
    if process == "Crawler":
      runningCrawlers = self._crawlerModel.runningCrawlers
      session = {"domainId": runningCrawlers.keys()[0]}
      self._crawlerModel.stopCrawler(process_info.get('description'), session)
    elif process == "SeedFinder":
      query = process_info["description"].replace('Query: ', '')
      self.stopSeedFinder(query)

    message = "Stopped process " + process
    description = process_info.get("description")
    if not description is None:
      message = message + " for " + description

    return message

  def getAvailableProjectionAlgorithms(self):
    return [{'name': key} for key in self.projectionsAlg.keys()]

  def getAvailablePageRetrievalCriteria(self):
    return [{'name': key} for key in self.pageRetrieval.keys()]

  def getAvailableDomains(self):
    # Initializes elastic search.
    self._es = es

    self._domains = get_available_domains(self._es)

    return \
    [{'id': k, 'name': d['domain_name'], 'creation': d['timestamp'], 'index': d['index'], 'doc_type': d['doc_type']} for k, d in self._domains.items()]

  def getAvailableTLDs(self, session):
    es_info = self._esInfo(session['domainId'])

    unique_tlds = {}

    for k, v in get_unique_values('domain.exact', None, self._all, es_info['activeDomainIndex'], es_info['docType'], self._es).items():
      if "." in k:
        unique_tlds[k] = v

    return unique_tlds

  def getAvailableQueries(self, session):
    es_info = self._esInfo(session['domainId'])
    queries = get_unique_values('query', None, self._all, es_info['activeDomainIndex'], es_info['docType'], self._es)

    return queries

  def getAvailableTags(self, session):
    es_info = self._esInfo(session['domainId'])

    query = {
      "query" : {
        "filtered" : {
          "filter" : {
            "missing" : { "field" : "tag"}
          }
        }
      }
    }
    tags_neutral = self._es.count(es_info['activeDomainIndex'], es_info['docType'],body=query)
    unique_tags = {"Neutral": tags_neutral['count']}

    tags = get_unique_values('tag', None, self._all, es_info['activeDomainIndex'], es_info['docType'], self._es)
    for tag, num in tags.iteritems():
      if tag != "":
        if unique_tags.get(tag) is not None:
          unique_tags[tag] = unique_tags[tag] + num
        else:
          unique_tags[tag] = num
      else:
        unique_tags["Neutral"] = unique_tags["Neutral"] + 1

    for tag in self._predefined_tags:
      if unique_tags.get(tag) is None:
        unique_tags[tag] = 0

    return unique_tags

  def addDomain(self, index_name):

    create_index(index_name, es=self._es)

    fields = index_name.lower().split(' ')
    index = '_'.join([item for item in fields if item not in ''])
    index_name = ' '.join([item for item in fields if item not in ''])
    entry = { "domain_name": index_name.title(),
              "index": index,
              "doc_type": "page",
              "timestamp": datetime.utcnow(),
            }

    load_config([entry])

    self._crawlerModel.updateDomains()
    def _esInfo(self, domainId):
        es_info = {
        "activeDomainIndex": self._domains[domainId]['index'],
        "docType": self._domains[domainId]['doc_type']
        }
        if not self._domains[domainId].get("mapping") is None:
        es_info["mapping"] = self._domains[domainId]["mapping"]
        else:
        es_info["mapping"] = self._mapping
        return es_info

  def _initACHE(self):

    with open(self._path+"/ache.yml","w") as fw:
      fw.write("#" + "\n")
      fw.write("# Example of configuration for running a Focused Crawl" + "\n")
      fw.write("#" + "\n")
      fw.write("target_storage.use_classifier: true" + "\n")
      fw.write("target_storage.store_negative_pages: true" + "\n")
      fw.write("target_storage.data_format.type: ELASTICSEARCH" + "\n")
      fw.write("target_storage.data_format.elasticsearch.rest.hosts:" + "\n")
      fw.write("  - http://" + es_server + ":9200" + "\n")
      fw.write("target_storage.english_language_detection_enabled: false" + "\n")

      fw.write("link_storage.max_pages_per_domain: 1000" + "\n")
      fw.write("link_storage.link_strategy.use_scope: false" + "\n")
      fw.write("link_storage.link_strategy.outlinks: true" + "\n")
      fw.write("link_storage.link_strategy.backlinks: false" + "\n")
      fw.write("link_storage.link_classifier.type: LinkClassifierBaseline" + "\n")
      fw.write("link_storage.online_learning.enabled: true" + "\n")

      fw.write("link_storage.online_learning.type: FORWARD_CLASSIFIER_BINARY" + "\n")
      fw.write("link_storage.online_learning.learning_limit: 1000" + "\n")
      fw.write("link_storage.link_selector: TopkLinkSelector" + "\n")
      fw.write("link_storage.scheduler.host_min_access_interval: 5000" + "\n")
      fw.write("link_storage.scheduler.max_links: 10000" + "\n")

      fw.write("crawler_manager.downloader.user_agent.name: ACHE" + "\n")
      fw.write("crawler_manager.downloader.user_agent.url: https://github.com/ViDA-NYU/ache" + "\n")
      fw.write("crawler_manager.downloader.valid_mime_types:" + "\n")
      fw.write(" - text/html" + "\n")
  def delDomain(self, domains):

    for index in domains.values():
      delete_index(index, self._es)
      ddt_terms_keys = [doc["id"] for doc in term_search("index", [index], 0, self._all, ["term"], "ddt_terms", "terms", self._es)["results"]]
      delete_document(ddt_terms_keys, "ddt_terms", "terms", self._es)

      data_dir = self._path + "/data/"
      data_domain  = data_dir + index
      if isdir(data_domain):
        shutil.rmtree(data_domain)

    delete_document(domains.keys(), "config", "domains", self._es)

    self._crawlerModel.updateDomains()

  def updateColors(self, session, colors):
    es_info = self._esInfo(session['domainId'])

    entry = {
      session['domainId']: {
        "colors": colors["colors"],
        "index": colors["index"]
      }
    }

    update_document(entry, "config", "tag_colors", self._es)

  def getTagColors(self, domainId):
    tag_colors = get_tag_colors(self._es).get(domainId)

    colors = None
    if tag_colors is not None:
      colors = {"index": tag_colors["index"]}
      colors["colors"] = {}
      for color in tag_colors["colors"]:
        fields  = color.split(";")
        colors["colors"][fields[0]] = fields[1]

    return colors

  def getResultModel(self, session):
    es_info = self._esInfo(session['domainId'])

    return self.predictData(session)

  def getAvailableModelTags(self, session):
    es_info = self._esInfo(session['domainId'])

    return self.predictUnlabeled(session)

  def getAvailableCrawledData(self, session):
    es_info = self._esInfo(session['domainId'])

    unique_tags = {}

    query = {
      "query" : {
        "term" : {
          "isRelevant": "relevant"
        }
      }
    }
    crawlData = self._es.count(es_info['activeDomainIndex'], es_info['docType'],body=query, request_timeout=30)
    count = crawlData['count']
    unique_tags["CD Relevant"] = count

    query = {
      "query" : {
        "term" : {
          "isRelevant": "irrelevant"
        }
      }
    }
    crawlData = self._es.count(es_info['activeDomainIndex'], es_info['docType'],body=query, request_timeout=30)
    count = crawlData['count']
    unique_tags["CD Irrelevant"] = count

    return unique_tags


  def getPagesSummaryDomain(self, opt_ts1 = None, opt_ts2 = None, opt_applyFilter = False, session = None):
    es_info = self._esInfo(session['domainId'])

    if opt_ts1 is None:
      now = time.gmtime(0)
      opt_ts1 = float(calendar.timegm(now))
    else:
      opt_ts1 = float(opt_ts1)

    if opt_ts2 is None:
      now = time.gmtime()
      opt_ts2 = float(calendar.timegm(now))
    else:
      opt_ts2 = float(opt_ts2)
    total_results = []
    total_results = get_most_recent_documents(2000, es_info['mapping'], ["url", es_info['mapping']["tag"]],
                                      None, es_info['activeDomainIndex'], es_info['docType'],  \
                                      self._es)
    if opt_applyFilter and session['filter'] != "":
      results = self._getPagesQuery(session)
    else:
      results = \
      range_search(es_info['mapping']["timestamp"], opt_ts1, opt_ts2, ['url',es_info['mapping']['tag']], True, session['pagesCap'], es_index=es_info['activeDomainIndex'], es_doc_type=es_info['docType'], es=self._es)


    relevant = 0
    irrelevant = 0
    neutral = 0
    otherTags = 0
    total_relevant = 0
    total_irrelevant = 0
    total_neutral = 0

    for res_total in total_results:
        try:
          total_tags = res_total[es_info['mapping']['tag']]
          if 'Irrelevant' in res_total[es_info['mapping']['tag']]:
            total_irrelevant = total_irrelevant + 1
          else:
            if "" not in total_tags:
                if 'Relevant' in total_tags:
                    total_relevant = total_relevant + 1
            else:
              total_neutral = total_neutral + 1
        except KeyError:
          total_neutral = total_neutral + 1

    for res in results:
        try:
          tags = res[es_info['mapping']['tag']]
          if 'Irrelevant' in res[es_info['mapping']['tag']]:
            irrelevant = irrelevant + 1
          else:
            if "" not in tags:
                if 'Relevant' in tags:
                    relevant = relevant + 1
                else:
                    otherTags = otherTags + 1
            else:
                neutral = neutral + 1
        except KeyError:
          neutral = neutral + 1 #1



    return { \
      'Relevant': relevant,
      'Irrelevant': irrelevant,
      'Neutral': neutral,
      'OtherTags': otherTags,
      'TotalRelevant': total_relevant,
      'TotalIrrelevant': total_irrelevant,
      'TotalNeutral': total_neutral
    }


  def _setPagesCountCap(self, pagesCap):
    self._pagesCap = int(pagesCap)

  def boostPages(self, pages):
    i = 0
    print 3 * '\n', 'boosted pages', str(pages), 3 * '\n'

  def getTermSnippets(self, term, session):
    es_info = self._esInfo(session['domainId'])


    s_fields = {
      "term": term,
      "index": es_info['activeDomainIndex'],
      "doc_type": es_info['docType'],
    }

    results = multifield_term_search(s_fields, 0, self._capTerms, ['tag'], self._termsIndex, 'terms', self._es)
    tags = results["results"]

    tag = []
    if tags:
      tag = tags[0]['tag'][0].split(';')

    return {'term': term, 'tags': tag, 'context': get_context(term.split('_'), es_info['mapping']['text'], 500, es_info['activeDomainIndex'], es_info['docType'],  self._es)}

  def deleteTerm(self,term, session):
    es_info = self._esInfo(session['domainId'])
    delete([term+'_'+es_info['activeDomainIndex']+'_'+es_info['docType']], self._termsIndex, "terms", self._es)

  def getAnnotatedTerms(self, session):
    es_info = self._esInfo(session['domainId'])

    s_fields = {
      "index": es_info['activeDomainIndex'],
      "doc_type": es_info['docType']
    }

    results = multifield_term_search(s_fields, 0, self._all, ['tag','term'], self._termsIndex, 'terms', self._es)

    hits = results["results"]
    terms = {}
    for hit in hits:
      term = hit['term'][0]
      terms[term] = {'tag':hit['tag'][0]}

    return terms

