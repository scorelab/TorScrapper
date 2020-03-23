#!/bin/bash

service haproxy restart
/opt/torscraper/scripts/harvest.sh
/opt/torscraper/scripts/push_list.sh /opt/torscraper/onions_list/onions.txt
/opt/torscraper/scripts/scrape.sh
