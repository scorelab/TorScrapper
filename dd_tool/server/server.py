import urlparse
from domain_discovery_API.models.domain_discovery_model import DomainModel
from domain_discovery_API.models.crawler_model import CrawlerModel
from domain_discovery_API.models.RadvizModel import RadvizModel
import json
import os
from threading import Lock
import cherrypy
from domain_discovery_API.server import Page
from ConfigParser import ConfigParser

class Server(Page):
  def __init__(self):
    path = os.path.dirname(os.path.realpath(__file__))
    self._ddtModel = DomainModel(path)
    self._crawlerModel = CrawlerModel(path)
    self._ddtModel.setCrawlerModel(self._crawlerModel)
    self._radvizModel = RadvizModel(path)
    models = {"domain": self._ddtModel, "crawler": self._crawlerModel, "radviz": self._radvizModel}
    super(Server, self).__init__(models, path)

@cherrypy.expose
  def seedcrawler(self):
    return open(os.path.join(self._HTML_DIR, u"index.html"))

  @cherrypy.expose
  def release(self):
    return open(os.path.join(self._HTML_DIR, u"release.html"))

  @cherrypy.expose
  def index(self):
    return self.seedcrawler()