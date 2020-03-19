FROM mariadb:10.2
ENV MYSQL_USER=torscraper
ENV MYSQL_PASSWORD=password
ENV MYSQL_DATABASE=tor
ENV MYSQL_ROOT_PASSWORD=somethingcomplicated
COPY schema.sql /docker-entrypoint-initdb.d/
