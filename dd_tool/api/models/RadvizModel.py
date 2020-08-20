from radviz import Radviz
import  numpy as np
from collections import OrderedDict
import json
from sklearn import linear_model
from online_classifier.tf_vector import tf_vectorizer
from domain_discovery_model import DomainModel
from elastic.config import es, es_doc_type, es_server
from elastic.get_config import get_available_domains, get_model_tags
from fetch_data import fetch_data

class RadvizModel(DomainModel):
    radviz = None

    def __init__(self, path):
        self._path = path
        self._es = es
        self._domains = get_available_domains(self._es)
        self._mapping = {"url":"url", "timestamp":"retrieved", "text":"text", "html":"html", "tag":"tag", "query":"query", "domain":"domain", "title":"title"}

    def _esInfo(self, domainId):
        self._domains = get_available_domains(self._es)
        es_info = {
          "activeDomainIndex": self._domains[domainId]['index'],
          "docType": self._domains[domainId]['doc_type']
        }
        if not self._domains[domainId].get("mapping") is None:
          es_info["mapping"] = self._domains[domainId]["mapping"]
        else:
          es_info["mapping"] = self._mapping
        return es_info

    def getRadvizPoints(self, session, filterByTerm):
        es_info = self._esInfo(session['domainId'])
        index = es_info['activeDomainIndex']
        max_features = 200

        if session.get('from') is None:
          session['from'] = 0
        format = '%m/%d/%Y %H:%M %Z'
        if not session.get('fromDate') is None:
          session['fromDate'] = long(DomainModel.convert_to_epoch(datetime.strptime(session['fromDate'], format)))
        if not session.get('toDate') is None:
          session['toDate'] = long(DomainModel.convert_to_epoch(datetime.strptime(session['toDate'], format)))
        results_data = self.getTextQuery(session)
        ddteval_data = fetch_data(results_data["results"], es_doc_type=es_doc_type, es=es)
        data = ddteval_data["data"]

        labels = ddteval_data["labels"]

        urls = ddteval_data["urls"]

        tf_v = tf_vectorizer(convert_to_ascii=True, max_features=max_features)
        [X, features] = tf_v.vectorize(data)

        matrix_transpose = np.transpose(X.todense())

        print "\n\n Number of 1-gram features = ", len(features)
        print "\n\n tf 1-gram matrix size = ", np.shape(X)

        self.radviz = Radviz(X, features, labels, urls)

        return_obj = {}
        for i in range(0, len(features)):
            return_obj[features[i]] = matrix_transpose[i,:].tolist()[0]
        labels_urls = OrderedDict([("labels",labels), ("urls",urls), ("title", ddteval_data["title"]),("snippet",ddteval_data["snippet"]),("image_url",ddteval_data["image_url"])])
        od = OrderedDict(list(OrderedDict(sorted(return_obj.items())).items()) + list(labels_urls.items()))

        return od

    def computeTSP(self):
        return self.radviz.compute_tsp()
