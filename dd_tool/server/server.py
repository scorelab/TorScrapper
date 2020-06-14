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

@cherrypy.expose
  def thing(self):
    cherrypy.response.headers['Content-Type'] = 'text/plain'
    def content():
      print "\n\n\nRUNNING CONTENT\n\n\n"
      yield json.dumps({"first":"Hello"})
      yield json.dumps({"first":"World"})
    return content()
  thing._cp_config = {'response.stream': True}

if __name__ == "__main__":
  server = Server()
  app = cherrypy.quickstart(server, config=Server.getConfig())
  cherrypy.config.update(server.config)
else:
  server = Server()
  config = Server.getConfig()
  app = cherrypy.tree.mount(server, config=config)

  @staticmethod
  def getConfig():
    config = ConfigParser()
    config.read(os.path.join(os.path.dirname(__file__), "config.conf"))
    configMap = {}
    for section in config.sections():
      configMap[section] = {}
      for option in config.options(section):
        val = config.get(section, option)
        if option == "server.socket_port" or option == "server.thread_pool":
          val = int(val)
        configMap[section][option] = val

    return configMap