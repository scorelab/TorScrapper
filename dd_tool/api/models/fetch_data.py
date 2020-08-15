from elastic.config import es
from elastic.get_documents import get_documents_by_id
from elasticsearch import Elasticsearch

from pprint import pprint


def fetch_data( results_data, categories=[], remove_duplicate=True, convert_to_ascii=True, preprocess=False, es_doc_type="page", es=None):

    MAX_WORDS = 1000

    records = []
    records = results_data

    result = {}
    labels = []
    urls = []
    snippet = []
    title = []
    image_url = []
    text = []
    topic_count = {}
    dup_count = 0
    i_title=0
    for rec in records:
        dup = -1
        try:
            dup = text.index(rec["text"][0])
        except KeyError:
            pprint(rec)
        except ValueError:
            dup = -1

        if remove_duplicate:
            if dup != -1:
                dup_count = dup_count + 1
                print rec["id"], " ", urls[dup]
                continue

        try:
            topic_name = ",".join(rec["tag"])
        except KeyError:
            topic_name = "Neutral"

        if (topic_name in categories) or len(categories) == 0:
            labels.append(topic_name)
            if preprocess:
                text.append(preprocess(rec["text"][0])[0:MAX_WORDS])
            else:
                if rec.get("text") is not None:
                    text.append(rec["text"][0][0:MAX_WORDS])
                else:
                    continue
            urls.append(rec["url"][0])
            if not rec.get('description') is None:
                snippet.append(" ".join(rec['description'][0].split(" ")[0:20]))
            if not rec.get('image_url') is None:
                image_url.append(rec['image_url'][0])
            if not rec.get('title') is None:
                title.append(rec['title'][0])
            else:
                title.append("")


            count = topic_count.get(topic_name)
            if count is None:
                count = 1
            else:
                count = count + 1
            topic_count[topic_name] = count

    if remove_duplicate:
        print "\n\nDuplicates found = ", dup_count

    result["labels"] = labels
    result["data"] = text
    result["urls"] = urls
    result["label_count"] = topic_count
    result["snippet"] = snippet
    result["title"] =title
    result["image_url"] = image_url
    return result

def preprocess(text, convert_to_ascii=True):
    text = text.lower().replace(","," ").replace("__"," ").replace("(", " ").replace(")", " ").replace("[", " ").replace("]", " ").replace(".", " ").replace("/", " ").replace("\\", " ").replace("_", " ").replace("#", " ").replace("-", " ").replace("+", " ").replace("%", " ").replace(";", " ").replace(":", " ").replace("'", " ").replace("\""," ").replace("^", " ")
    text = text.replace("\n"," ")

    if convert_to_ascii:
        ascii_text = []
        for x in text.split(" "):
            try:
                ascii_text.append(x.encode('ascii', 'ignore'))
            except:
                continue

        text = " ".join(ascii_text)

    preprocessed_text = " ".join([word.strip() for word in text.split(" ") if len(word.strip()) > 2 and (word.strip() != "") and (isnumeric(word.strip()) == False) and notHtmlTag(word.strip()) and notMonth(word.strip())])

    return preprocessed_text

def notHtmlTag(word):
    html_tags = ["http", "html", "img", "images", "image", "index"]

    for tag in html_tags:
        if (tag in word) or (word in ["url", "com", "www", "www3", "admin", "backup", "content"]):
            return False

    return True

def notMonth(word):
    month_tags = ["jan", "january", "feb", "february","mar", "march","apr", "april","may", "jun", "june", "jul", "july", "aug", "august","sep", "sept", "september","oct","october","nov","november","dec", "december","montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sontag"]

    if word in month_tags:
        return False

    return True

def isnumeric(s):
    try:
        int(s)
        return True
    except ValueError:
        try:
            long(s)
            return True
        except ValueError:
            return False
