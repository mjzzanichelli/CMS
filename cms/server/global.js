var _global = {
	web_host: "127.0.0.1"
	, web_port: 3000
	, api_host: "127.0.0.1"
	, api_port: 4000
}
, _web = require('./webserver')
, _api = require('./apiserver')
;

_web.server.listen(_global.web_port, _global.web_host, function() {
	console.log("Web Server "+ _global.web_host +" listening on port "+ _global.web_port +".");
});

_api.server.listen(_global.api_port, _global.api_host, function() {
	_api.web = _web;
	console.log("API Server "+ _global.api_host +" listening on port "+ _global.api_port +".");
});
