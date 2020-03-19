FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.10

MAINTAINER Olivier Bilodeau <obilodeau@gosecure.ca>

RUN apt-get update && apt-get -y install \
  python-lxml \
  build-essential \
  libssl-dev \
  libffi-dev \
  python-dev \
  libxml2-dev \
  libxslt1-dev \
  openjdk-8-jre \
  && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/torscraper/
WORKDIR /opt/torscraper

# install requirements
COPY ../requirements.txt /opt/torscraper
RUN pip install --no-cache-dir -r ../requirements.txt
RUN pip install --upgrade requests

# move codebase over
COPY ../* /opt/torscraper

## override settings via localsettings.py
#COPY docker/crawler/settings.py /usr/src/app/crawling/localsettings.py
#
## copy testing script into container
#COPY docker/run_docker_tests.sh /usr/src/app/run_docker_tests.sh
#
## set up environment variables
#
## run the spider
#CMD ["scrapy", "runspider", "crawling/spiders/link_spider.py"]
#CMD ["/opt/torscraper/scripts/start.sh"]
#CMD ["/opt/torscraper/scripts/harvest.sh"]
CMD ["/opt/torscraper/scripts/sleep.sh"]