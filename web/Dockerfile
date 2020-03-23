FROM python:2.7-alpine
MAINTAINER Olivier Bilodeau <obilodeau@gosecure.ca>

RUN apk update && \
    apk add python python-dev libffi-dev gcc make musl-dev py-pip mysql-client openssl-dev

RUN mkdir -p /opt/torscraper/web
COPY . /opt/torscraper/web
WORKDIR /opt/torscraper/web

RUN pip install -r requirements.txt

RUN chmod +x /opt/torscraper/web/docker-entrypoint.sh

CMD ["/opt/torscraper/web/docker-entrypoint.sh"]
