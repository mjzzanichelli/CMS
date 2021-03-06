var http = require('http')
, MultipartParser = require('./MultipartParser.js')
, server
;

server = http.createServer(function(req, res){
	//console.log(res)
	/*res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");*/
	if (req.url.indexOf('/API/Editor/') == 0) {
		res.writeHead(200, {'Access-Control-Allow-Origin' : '*'});
		
		if (req.method=="POST"){
			var _params = "";
			req.on("data", function(chunk){
				_params+=chunk;
		    });
		    req.on("end", function(){          
		    	_params = JSON.parse(_params);
		    	module.exports.web.methods.readFile(_params.page.phisical,function(data){
		    		//console.log(_params)
		    		var _fragment = data["content"]("["+ _params["fragment"]["ref"] +"="+ _params["fragment"]["id"] +"]");
		    		_fragment.html(_params["fragment"]["html"]);	    		
		    		module.exports.web.methods.writeFile(_params.page.phisical,data["content"].html(),function(resp){
		    			res.end(JSON.stringify({"fragment":_fragment.html()}));	
		    		});
		    	});
		    });
	   	}
		
		
		//res.end(JSON.stringify(ret));
		if (false){ 
			switch (req.method) {        
				case 'GET':
					var _url_arr = req.url.split("/")
					, _params
					;
					switch(_url_arr.length){
						case 4:	//Select Single List by ID
							_params = _url_arr[3];
							//module.exports.dbclient.ListSelect(_params,function(ret){
					    		res.end(JSON.stringify(ret));
					    	//});
						break;
						case 5:
							_params = {"order":parseInt(_url_arr[3],10),"limit":parseInt(_url_arr[4],10)};
							//module.exports.dbclient.ListsOrederTop(_params,function(ret){
								res.end(JSON.stringify(ret));
					    	//});
						break;
					}
				break;
				case 'POST':
					var _params = "";
					req.setEncoding('utf8'); 
					req.on("data", function(chunk){    
						_params+=chunk;
				    });
				    req.on("end", function(){          
				    	_params = JSON.parse(_params);
				    	//module.exports.dbclient.ListCreate(_params,function(ret){
				    		res.end(JSON.stringify(ret));
				    	//});
				    });
				break;
				case 'PUT':
					var _params = "";
					req.setEncoding('utf8'); 
					req.on("data", function(chunk){    
						_params+=chunk;
				    });
				    req.on("end", function(){          
				    	_params = JSON.parse(_params);
				    	//module.exports.dbclient.ListSave(_params,function(ret){
				    		res.end(JSON.stringify(ret));
				    	//});
				    });
				break;
				case 'DELETE':
					var _url_arr = req.url.split("/")
					, _params
					;
					if (_url_arr.length==4){
						_params = _url_arr[3];
						//module.exports.dbclient.ListDelete(_params,function(ret){
							res.end(JSON.stringify(ret));
						//});
					}
				break;
				
			}
		}
	}
	
	if (req.url.indexOf('/API/Upload/') == 0) {
		res.writeHead(200, {
			'Access-Control-Allow-Origin' : '*'
			/*, 'Access-Control-Allow-Methods': 'PUT, GET, POST, DELETE, OPTIONS'
			, 'Access-Control-Allow-Headers': 'X-Requested-With'*/
		});
		//console.log("A");
		//req.setEncoding('binary');
		if (req.method=="POST"){
			//console.log("B");
			var _params = "";
			req.on("data", function(chunk){
				_params+=chunk;
				//console.log("C");
		    });
		    req.on("end", function(){ 
				//console.log("D");
		        if ( req.headers.hasOwnProperty('content-type') ) {
		        	//console.log("E");
		            var multipartData = new MultipartParser(req.headers['content-type'],_params);
		            var _file = multipartData.parts[multipartData.fields[0]];
		            //console.log(multipartData.parts.imgFile.body);
		            var filename = "/CMS/cms/pages/storage/"+_file.disposition.filename.replace(/ /g,"_");
		            module.exports.web.methods.createStorageFile(filename,_file.body,function(resp){
		            	//console.log("file been created",filename);
		            	//console.log(resp);
		            	res.end(JSON.stringify({"filename":resp.filename}));
		            });
		        }        
		    });
	   	}
	}
});

module.exports = {
	server: server
	, web: null
};
