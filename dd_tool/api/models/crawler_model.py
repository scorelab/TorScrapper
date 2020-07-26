from subprocess import Popen
from subprocess import PIPE
from os.path import isfile, join, exists, isdir
from os import chdir, listdir, environ, makedirs, rename, chmod, walk, remove
import linecache
from sys import exc_info
import urllib2
import base64
import json
from zipfile import ZipFile
import requests
from requests.exceptions import ConnectionError
from pprint import pprint
from ache_config import ache_focused_crawler_server, ache_focused_crawler_port, ache_deep_crawler_server, ache_deep_crawler_port
from ache_config import ache_focused_crawler_monitor_server, ache_focused_crawler_monitor_port, ache_deep_crawler_monitor_server, ache_deep_crawler_monitor_port
from elastic.search_documents import multifield_term_search
from elastic.misc_queries import exec_query
from elastic.aggregations import get_unique_values
from elastic.get_config import get_available_domains, get_model_tags
from elastic.config import es
from elastic.add_documents import update_document

class CrawlerModel():

    def __init__(self, path):
        self._path = path
        self._all = 100000
        self._es = es
        self._termsIndex = "ddt_terms"
        self.runningCrawlers={}
        self._domains = get_available_domains(self._es)
        self._mapping = {"url":"url", "timestamp":"retrieved", "text":"text", "html":"html", "tag":"tag", "query":"query", "domain":"domain", "title":"title"}
        self._servers = {"focused": "http://"+ache_focused_crawler_server+":"+ache_focused_crawler_port,
                         "deep": 'http://'+ache_deep_crawler_server+":"+ache_deep_crawler_port}
        self._crawler_monitors = {"focused": "http://"+ache_focused_crawler_monitor_server+":"+ache_focused_crawler_monitor_port,
                                  "deep": 'http://'+ache_deep_crawler_monitor_server+":"+ache_deep_crawler_monitor_port}
        self._checkCrawlers()

    def _checkCrawlers(self):
        deep_crawl_status = self.getStatus('deep')
        focused_crawl_status = self.getStatus('focused')
        for domainId, info in self._domains.items():
            if info['index'] == deep_crawl_status.get('esIndexName') and deep_crawl_status.get("crawlerState") == 'RUNNING':
                    self.runningCrawlers[domainId] = {'deep': {'domain': self._domains[domainId]['domain_name'], 'status': "Running" }}
            elif info['index'] == focused_crawl_status.get('esIndexName') and focused_crawl_status.get("crawlerState") == 'RUNNING':
                self.runningCrawlers[domainId] = {'deep': {'domain': self._domains[domainId]['domain_name'], 'status': "Running" }}

    def crawlerStopped(self, type, session):
        domainId = session["domainId"]

        self.runningCrawlers[domainId].pop(type)
        if len(self.runningCrawlers[domainId].keys()) == 0:
            self.runningCrawlers.pop(domainId)

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

    def _encode(self, url):
        return urllib2.quote(url).replace("/", "%2F")

    def updateDomains(self):
        self._domains = get_available_domains(self._es)

    def getCrawlerServers(self):
        return self._crawler_monitors


    def createModel(self, session=None, zip=True):
        """ Create an ACHE model to be applied to SeedFinder and focused crawler.
        It saves the classifiers, features, the training data in the <project>/data/<domain> directory.
        If zip=True all generated files and folders are zipped into a file.

        Parameters:
        session (json): should have domainId

        Returns:
        Zip file url or message text
        """
        path = self._path

        es_info = self._esInfo(session["domainId"])

        data_dir = path + "/data/"
        data_domain  = data_dir + es_info['activeDomainIndex']
        data_training = data_domain + "/training_data/"
        data_negative = data_domain + "/training_data/negative/"
        data_positive = data_domain + "/training_data/positive/"

        if (not isdir(data_positive)):
            # Create dir if it does not exist
            makedirs(data_positive)
        else:
            # Remove all previous files
            for filename in listdir(data_positive):
                remove(data_positive+filename)

        if (not isdir(data_negative)):
            # Create dir if it does not exist
            makedirs(data_negative)
        else:
            # Remove all previous files
            for filename in listdir(data_negative):
                remove(data_negative+filename)

        pos_tags = ["Relevant"]
        neg_tags = ["Irrelevant"]

        try:
            pos_tags = session['model']['positive']
        except KeyError:
            print "Using default positive tags"

        try:
            neg_tags = session['model']['negative']
        except KeyError:
            print "Using default negative tags"

        pos_docs = []

        for tag in pos_tags: #.split(','):
            s_fields = {}
            query = {
                "wildcard": {es_info['mapping']["tag"]:tag}
            }
            s_fields["queries"] = [query]

            results = multifield_term_search(s_fields,
                                             0, self._all,
                                             ["url", es_info['mapping']['html']],
                                             es_info['activeDomainIndex'],
                                             es_info['docType'],
                                             self._es)

            pos_docs = pos_docs + results['results']

        pos_html = {field['url'][0]:field[es_info['mapping']["html"]][0] for field in pos_docs}

        neg_docs = []
        for tag in neg_tags: #.split(','):
            s_fields = {}
            query = {
                "wildcard": {es_info['mapping']["tag"]:tag}
            }
            s_fields["queries"] = [query]
            results = multifield_term_search(s_fields,
                                             0, self._all,
                                             ["url", es_info['mapping']['html']],
                                             es_info['activeDomainIndex'],
                                             es_info['docType'],
                                             self._es)
            neg_docs = neg_docs + results['results']

        neg_html = {field['url'][0]:field[es_info['mapping']["html"]][0] for field in neg_docs}

        seeds_file = data_domain +"/seeds.txt"
        print "Seeds path ", seeds_file
        with open(seeds_file, 'w') as s:
            for url in pos_html:
                try:
                    file_positive = data_positive + self._encode(url.encode('utf8'))
                    s.write(url.encode('utf8') + '\n')
                    with open(file_positive, 'w') as f:
                        f.write(pos_html[url].encode('utf8'))

                except IOError:
                    _, exc_obj, tb = exc_info()
                    f = tb.tb_frame
                    lineno = tb.tb_lineno
                    filename = f.f_code.co_filename
                    linecache.checkcache(filename)
                    line = linecache.getline(filename, lineno, f.f_globals)
                    print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)

        for url in neg_html:
            try:
                file_negative = data_negative + self._encode(url.encode('utf8'))
                with open(file_negative, 'w') as f:
                    f.write(neg_html[url].encode('utf8'))
            except IOError:
                _, exc_obj, tb = exc_info()
                f = tb.tb_frame
                lineno = tb.tb_lineno
                filename = f.f_code.co_filename
                linecache.checkcache(filename)
                line = linecache.getline(filename, lineno, f.f_globals)
                print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)

        domainmodel_dir = data_domain + "/models/"

        if (not isdir(domainmodel_dir)):
            makedirs(domainmodel_dir)
        else:
            # Remove all previous files
            for filename in listdir(domainmodel_dir):
                remove(domainmodel_dir+filename)


        if len(neg_docs) > 0:
            ache_home = environ['ACHE_HOME']
            comm = ache_home + "/bin/ache buildModel -t " + data_training + " -o "+ domainmodel_dir + " -c " + ache_home + "/config/sample_config/stoplist.txt"
            p = Popen(comm, shell=True, stderr=PIPE)
            output, errors = p.communicate()
            print output
            print errors
        else:
            return "No irrelevant pages to build domain model"

        if zip:
            return self._createModelZip(session)

        return "Model created successfully"

    def createResultModel(self, session=None, relevantUrls=[], irrelevantUrls=[], unsureUrls=[], zip=True):
        """
        It saves the classified data in the <project>/data/<domain> directory.
        If zip=True all generated files are zipped into a file.

        Parameters:
        session (json): should have domainId

        Returns:
        Zip file url or message text
        """
        path = self._path

        es_info = self._esInfo(session["domainId"])

        data_dir = path + "/data/"
        data_domain  = data_dir + es_info['activeDomainIndex']

        if (not isdir(data_domain)):
            # Create dir if it does not exist
            makedirs(data_domain)
        else:
            # Remove all previous files
            for filename in listdir(data_domain):
                if(isfile(filename)):
                    remove(data_domain+"/"+filename)


        seeds_file = data_domain +"/relevantseeds.txt"
        print "Seeds path ", seeds_file
        with open(seeds_file, 'w') as s:
            for url in relevantUrls:
                try:
                    s.write(str(url) + '\n')
                except IOError:
                    _, exc_obj, tb = exc_info()
                    f = tb.tb_frame
                    lineno = tb.tb_lineno
                    filename = f.f_code.co_filename
                    linecache.checkcache(filename)
                    line = linecache.getline(filename, lineno, f.f_globals)
                    print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)

        seeds_irr_file = data_domain +"/irrelevantseeds.txt"
        print "Seeds Irrelevant path ", seeds_irr_file
        with open(seeds_irr_file, 'w') as sn:
            for url in irrelevantUrls:
                try:
                    sn.write(str(url) + '\n')
                except IOError:
                    _, exc_obj, tb = exc_info()
                    f = tb.tb_frame
                    lineno = tb.tb_lineno
                    filename = f.f_code.co_filename
                    linecache.checkcache(filename)
                    line = linecache.getline(filename, lineno, f.f_globals)
                    print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)

        seeds_unsure_file = data_domain +"/unsureseeds.txt"
        print "Seeds Unsure path ", seeds_unsure_file
        with open(seeds_unsure_file, 'w') as un:
            for url in unsureUrls:
                try:
                    un.write(str(url) + '\n')
                except IOError:
                    _, exc_obj, tb = exc_info()
                    f = tb.tb_frame
                    lineno = tb.tb_lineno
                    filename = f.f_code.co_filename
                    linecache.checkcache(filename)
                    line = linecache.getline(filename, lineno, f.f_globals)
                    print 'EXCEPTION IN ({}, LINE {} "{}"): {}'.format(filename, lineno, line.strip(), exc_obj)

        if zip:
            return self._createResultModelZip(session)

        return "Model created successfully"