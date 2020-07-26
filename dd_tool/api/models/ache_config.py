from os import environ

if environ.get('ACHE_FOCUSED_CRAWLER_SERVER'):
    ache_focused_crawler_server = environ['ACHE_FOCUSED_CRAWLER_SERVER']
else:
    ache_focused_crawler_server = 'localhost'

if environ.get('ACHE_FOCUSED_CRAWLER_PORT'):
    ache_focused_crawler_port = environ['ACHE_FOCUSED_CRAWLER_PORT']
else:
    ache_focused_crawler_port = "8080"

if environ.get('ACHE_DEEP_CRAWLER_SERVER'):
    ache_deep_crawler_server = environ['ACHE_DEEP_CRAWLER_SERVER']
else:
    ache_deep_crawler_server = 'localhost'

if environ.get('ACHE_DEEP_CRAWLER_PORT'):
    ache_deep_crawler_port = environ['ACHE_DEEP_CRAWLER_PORT']
else:
    ache_deep_crawler_port = "8080"

if environ.get('ACHE_FOCUSED_CRAWLER_MONITOR_SERVER'):
    ache_focused_crawler_monitor_server = environ['ACHE_FOCUSED_CRAWLER_MONITOR_SERVER']
else:
    ache_focused_crawler_monitor_server = ache_focused_crawler_server

if environ.get('ACHE_FOCUSED_CRAWLER_MONITOR_PORT'):
    ache_focused_crawler_monitor_port = environ['ACHE_FOCUSED_CRAWLER_MONITOR_PORT']
else:
    ache_focused_crawler_monitor_port = ache_focused_crawler_port

if environ.get('ACHE_DEEP_CRAWLER_MONITOR_SERVER'):
    ache_deep_crawler_monitor_server = environ['ACHE_DEEP_CRAWLER_MONITOR_SERVER']
else:
    ache_deep_crawler_monitor_server = ache_deep_crawler_server

if environ.get('ACHE_DEEP_CRAWLER_MONITOR_PORT'):
    ache_deep_crawler_monitor_port = environ['ACHE_DEEP_CRAWLER_MONITOR_PORT']
else:
    ache_deep_crawler_monitor_port = ache_deep_crawler_port