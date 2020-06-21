from elasticsearch import Elasticsearch
from os import environ
import certifi

if es_user:
    if use_ssl:
        es = Elasticsearch([es_server+":"+es_port], http_auth=(es_user, es_passwd), use_ssl=True, verify_certs=True, ca_certs=certifi.where(), timeout=100)
    else:
        es = Elasticsearch([es_server+":"+es_port], http_auth=(es_user, es_passwd), timeout=100)
else:
    es = Elasticsearch([es_server+":"+es_port])

if environ.get('ELASTICSEARCH_DOC_TYPE'):
    es_doc_type = environ['ELASTICSEARCH_DOC_TYPE']
else:
    es_doc_type = 'page'

if environ.get('ELASTICSEARCH_PORT'):
    es_port = environ['ELASTICSEARCH_PORT']
else:
    es_port = "9200"

print 'ELASTICSEARCH_SERVER ', es_server

if environ.get('ELASTICSEARCH_SERVER'):
    use_ssl = False
    es_server = environ['ELASTICSEARCH_SERVER']
    if "https" in es_server:
        use_ssl=True
else:
    es_server = 'localhost'


if es_user is not "":
    print 'ELASTICSEARCH_USER ', es_user

if environ.get('ELASTICSEARCH_PASSWD'):
    es_passwd = environ['ELASTICSEARCH_PASSWD']
else:
    es_passwd = ""

if environ.get('ELASTICSEARCH_USER'):
    es_user = environ['ELASTICSEARCH_USER']
else:
    es_user = ""