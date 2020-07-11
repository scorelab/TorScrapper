from sklearn.feature_extraction import DictVectorizer
import math
from sets import Set
import time
import numpy as np
import nltk
from elastic.get_documents import get_documents_by_id
from config import es as default_es

ENGLISH_STOPWORDS = set(nltk.corpus.stopwords.words('english'))

def terms_from_es_json(doc, rm_stopwords=True, rm_numbers=True, termstatistics = False, mapping=None, es=None):
    terms = {}
    docterms = doc["term_vectors"][mapping['text']]["terms"]
    n_doc = doc["term_vectors"][mapping['text']]["field_statistics"]["doc_count"]
    valid_words = docterms.keys()
    
    if rm_stopwords:
        valid_words = [k for k in valid_words if k not in ENGLISH_STOPWORDS and (len(k) > 2)]

    if rm_numbers:
        valid_words = [k for k in valid_words if not k.lstrip('-').replace('.','',1).replace(',','',1).isdigit()]
        
    if termstatistics == True:
        terms = {term: {'tfidf':tfidf(docterms[term]["term_freq"], docterms[term]["doc_freq"], n_doc),
                        'tf': docterms[term]["term_freq"],
                        'ttf': docterms[term]["ttf"],
                    } for term in valid_words if docterms[term]["ttf"] > 1
        }
    else:
        terms = { term: {'tf': docterms[term]} for term in valid_words }

    return terms