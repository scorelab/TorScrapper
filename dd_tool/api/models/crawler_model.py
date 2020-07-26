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