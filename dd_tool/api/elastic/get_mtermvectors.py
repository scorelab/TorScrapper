import nltk
import math
from sets import Set
import time
import numpy as np
import operator
from sklearn.feature_extraction import DictVectorizer
from config import es as default_es
from elastic.get_documents import get_documents_by_id

ENGLISH_STOPWORDS = set(nltk.corpus.stopwords.words('english'))
MAX_TERMS = 2000

def terms_from_es_json(doc, rm_stopwords=True, rm_numbers=True, termstatistics = False, term_freq = 0, mapping=None, es=None):
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
                    } for term in valid_words if docterms[term]["ttf"] > term_freq
        }
    else:
        terms = { term: {'tf': docterms[term]['term_freq']} for term in valid_words if docterms[term]["term_freq"] > term_freq}

    # Restrict the number of terms for large documents
    if len(terms.keys()) > MAX_TERMS:
        sorted_terms = []
        if termstatistics == True:
            terms_tfidf = {term:terms[term]["tfidf"] for term in terms.keys()}
            sorted_terms = sorted(terms_tfidf.items(), key=operator.itemgetter(1), reverse=True)
        else:
            terms_tf = {term:terms[term]["tf"] for term in terms.keys()}
            sorted_terms = sorted(terms_tf.items(), key=operator.itemgetter(1), reverse=True)

        terms = {item[0]: terms[item[0]] for item in sorted_terms[0:MAX_TERMS]}

    return terms

def pos_filter(pos_tags=['NN', 'NNS', 'NNP', 'NNPS', 'VBN', 'JJ'], docterms=[]):
    tagged = nltk.pos_tag(docterms)
    valid_words = [tag[0] for tag in tagged if tag[1] in pos_tags]
    return valid_words

def tfidf(tf, df, n_doc):
    idf = math.log(n_doc / float(df))
    return tf * idf