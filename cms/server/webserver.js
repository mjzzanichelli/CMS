var http  = require('http')
, fs    = require('fs')
, cheerio = require('cheerio')
, path  = require('path')
, mime  = require('mime')
, server
, use_cache = false
, cache = {}
;

server = http.createServer(function(request, response) { 
    var filePath = false;
	if (request.url == '/') {
		filePath = 'public/index.html'; 
	} else {
		filePath = '../../..' + request.url; 
	}

	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
	
	/*fs.exists("../../../CMS/src/test.html", function(exists) {
		console.log(exists)
	})*/
});

function send404(response) {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200,
		{"content-type": mime.lookup(path.basename(filePath))}
	);
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (use_cache && cache[absPath]) { 
		sendFile(response, absPath, cache[absPath]); 
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data) { 
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data); 
					}
				});
			} else {
				send404(response); 
			}
		});
	}
}

function readFile(absPath,callback) {
  	if (callback){
	  	absPath = "../../.."+absPath;
	  	fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, 'utf8', function(err, data) { 
					if (err) {
						callback({"error":"file not readable"});
					} else {
						var _content = cheerio.load(data);
						callback({"content":_content});
					}
				});
			} else {
				callback({"error":"file doesn't exists"});
			}
		});
	}
}

function writeFile(absPath,content,callback) {
  	if (callback){
	  	absPath = "../../.."+absPath;
	  	fs.exists(absPath, function(exists) {
			if (exists) {
				fs.writeFile(absPath, content, function(err) { 
					if (err) {
						callback({"error":"file not whiteble"});
					} else {
						callback({"content":content});
					}
				});
			} else {
				callback({"error":"file doesn't exists"});
			}
		});
	}
}

function createStorageFile(absPath,content,callback,count) {
  	if (callback){
  		var count = count||0
  			, _absPathArr = absPath.split("/")
  			, _absPath = "../../.."
  		;
  		_absPathArr[_absPathArr.length-1] = (count==0?"":count+"_")+_absPathArr[_absPathArr.length-1];
  		_absPathArr = _absPathArr.join("/");
  		_absPath += _absPathArr;
	  		
	  	fs.exists(_absPath, function(exists) {
			if (exists) createStorageFile(absPath,content,callback,count+1);
			else {
				fs.writeFile(_absPath, content, 'binary', function(err) { 
					if (err) {
						callback({"error":"file not whiteble"});
					} else callback({"filename":_absPathArr});
				});
			}
		});
	}
}

module.exports = {
	server: server
	, methods: {
		readFile: readFile
		, writeFile: writeFile
		, createStorageFile: createStorageFile
	}
};