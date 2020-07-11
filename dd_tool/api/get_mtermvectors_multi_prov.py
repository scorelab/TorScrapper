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

def getTermStatistics(all_hits, rm_stopwords=True, rm_numbers=True, pos_tags=[], mapping=None, es_index='memex', es_doc_type='page', es=None):
    if es is None:
        es = default_es

    executor = concurrent.futures.ProcessPoolExecutor(10)

    futures = []
    for i in range(0, len(all_hits), 10):
        hits = all_hits[i:i+10]

        futures.append(executor.submit(computeTermStats, hits))
    concurrent.futures.wait(futures)    
    
    tfidfs = []
    for stat in stats:
        tfidf={}
        for k in stat.keys():
            tfidf[k] =stat[k]['tfidf']
        tfidfs.append(tfidf)

    tfs = []
    for stat in stats:
        tf={}
        for k in stat.keys():
            tf[k] =stat[k]['tf']
        tfs.append(tf)
    
    v_tfidf = DictVectorizer()
    v_tf = DictVectorizer()

    data = v_tfidf.fit_transform(tfidfs).toarray()
    corpus = v_tfidf.get_feature_names()
    tf_data = v_tf.fit_transform(tfs).toarray()
    
    if len(pos_tags) > 0:
        filtered_words = pos_filter(pos_tags, corpus)
        indices = [corpus.index(term) for term in corpus if term not in filtered_words]
        corpus =  np.delete(corpus, indices)
        corpus = corpus.tolist()
        data =  np.delete(data, indices, 1)
        tf_data =  np.delete(tf_data, indices, 1)
        ttf = {key:value for key, value in ttf.iteritems() if key in corpus}

    result = [data, tf_data, ttf, corpus, docs]

    del tfidfs
    del tfs
    
    return result
