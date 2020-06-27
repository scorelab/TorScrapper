#!/usr/bin/python
from config import es as default_es
from random import randint

def random_sample(query_input, filters, fields, pagesCount=100, es_index='memex', es_doc_type='page', es=None):
    
    if len(filters) == 0:
        return []
    
    if es is None:
        es = default_es

    random_score = {
        "random_score": { 
            "seed": randint(1, 100) 
        }
    }
    
    filters.append(random_score)
    
    query = {
        "query": {
            "function_score": {
                "functions": filters
            }
        }
    }

    if not query_input is None:
        query["query"]["function_score"]["query"] = query
        
    query["fields"] = fields

    res = es.search(body=query, index=es_index, doc_type=es_doc_type, size=pagesCount, request_timeout=30)
        
    hits = res['hits']['hits']

    results = []
    for hit in hits:
        fields = hit['fields']
        fields['id'] = hit['_id']
        fields['score'] = hit['_score']
        results.append(fields)

    return results

def exec_query(query, fields, start=0, pagesCount=100, es_index='memex', es_doc_type='page', es=None):
    if es is None:
        es = default_es

    query = query
    query["fields"] = fields

    res = es.search(body=query, index=es_index, doc_type=es_doc_type, from_=start, size=pagesCount, request_timeout=60)
        
    hits = res['hits']['hits']

    results = []
    for hit in hits:
        fields = hit['fields']
        fields['id'] = hit['_id']
        fields['score'] = hit['_score']
        results.append(fields)

    return {"total":res["hits"]["total"], "results":results}

