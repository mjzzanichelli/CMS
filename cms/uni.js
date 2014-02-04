var UNI = (function() {
	if (UNI) return UNI; 
	var CONFIG = {
		"site" : {
			"ext" : "cms"//global prefix
			, "controller" : "id"//suffix for controllers attribute >> ext-controller
			, "editor" : "ref"//suffix for controllers editor attribute >> ext-controller-editor
			, "modal" : "modal"//suffix for modal ID >> ext-modal
			, "panel": "panel" //suffix for modal panel ID >> ext-modal-panel
			, "pages" : undefined
			, "API" : {
				"editor": "http://127.0.0.1:4000/API/Editor/"
				, "upload": "http://127.0.0.1:4000/API/Upload/"
			}
		}
		, "page" : undefined
		, "controllers": undefined
		, "loaded": false
	};
	
	var messages = {
			1: "$$.created"
			, 2: "UNI.phisical_page.created"
		}
	;
	
	var IO = ( function() {
		var id = 0;
		var subscribe = function(msg, fn, prev) {
			if (!IO.notes[msg])
				IO.notes[msg] = [];
			var message = {
				context : this,
				callback : fn
			};
			if (prev) {
				for (var i = 0, l = IO.notes[msg].length; i < l; i++) {
					if (message.context && IO.notes[msg][i].context != message.context){
						message.callback.apply(message.context, IO.notes[msg][i].arguments);
					}
				}
			}
			IO.notes[msg].unshift(message);
			return this;
		};

		var unsubscribe = function(msg, fn) {
			if (IO.notes[msg]) {
				var i = IO.notes[msg].length, subscription;
				while (i--) {
					subscription = IO.notes[msg][i];
					if (subscription.context == this) {
						if (fn === undefined || (fn && fn == subscription.callback))
							IO.notes[msg].splice(i, 1);
					}
				}
				i = subscription = null;
			}
			return this;
		};

		var publish = function(msg) {
			
			if (!IO.notes[msg])
				return false;
			var args = Array.prototype.slice.call(arguments, 1), subscription, i = IO.notes[msg].length;
			while (i--) {
				subscription = IO.notes[msg][i];
				subscription.arguments = args;
				//console.log(subscription.context.id)
				subscription.callback.apply(subscription.context, args);
			}
			return this;
		};
		
		/*setValue method implement automatic publishing for notification 'propertyChanged'*/
		var setValue = function(property, value) {
			if (!this[property])
				return false;
			var before = this[property];
			this[property] = value;
			this.publish('propertyChanged', {
				'context' : this,
				'property' : property,
				'before' : before.toString(),
				'value' : value.toString()
			});
			return this;
		};

		return {
			notes : {},
			publish : publish,
			subscribe : subscribe,
			unsubscribe : unsubscribe,
			setValue : setValue,
			installTo : function(obj) {
				obj = obj || {};
				obj.subscribe = subscribe;
				obj.unsubscribe = unsubscribe;
				obj.publish = publish;
				obj.setValue = setValue;
				obj.id = id;
				id++;
				return obj;
			}
		};
	}());

	var appendScript = function(params) {
		if (params && params["path"]) {
			var _script = document.createElement("SCRIPT"), _cont = params["cont"] || document.getElementsByTagName("HEAD")[0];
			_script.src = params["path"];
			_script.type = "text/javascript";
			if (params["id"])
				_script.id = params["id"];
			if (params["callback"]) {
				_script.onreadystatechange = function() {
					if (this.readyState == 'complete') params["callback"]();
				};
				_script.onload = params["callback"];
			}
			_cont.appendChild(_script);
		}
	};

	var appendStyle = function(params) {
		if (params && params["path"]) {
			var _style = document.createElement("LINK"), _cont = params["cont"] || document.getElementsByTagName("HEAD")[0];
			_style.href = params["path"];
			_style.type = "text/css";
			_style.rel = "stylesheet";
			if (params["id"])
				_style.id = params["id"];
			if (params["callback"]) {
				_style.onreadystatechange = function() {
					if (this.readyState == 'complete') params["callback"]();
				};
				_style.onload = params["callback"];
			}
			_cont.appendChild(_style);
		}
	};
	
	var destroyOBJ = function(obj,key){
		if (obj && obj[key] && obj[key]["$$"]){
			obj[key].remove();
			delete obj[key];
		}
	};
	
	var setModalPanel = function(){
		var _options = document.createElement("DIV")
			, _send
			, _cancel
			, _controller = $$.getAttributes(CONFIG["fragments"]["panel"]["ref"],CONFIG["refs"]["editor"])[CONFIG["refs"]["editor"]]
			, _panel
			, _val
			, _repl
			, _html
		;
		
		_controller = CONFIG["page"]["fragments"][_controller];
		_controller = CONFIG["controllers"][_controller];
		CONFIG["fragments"]["panel"]["ctrl"] = _controller;
		CONFIG["fragments"]["panel"]["obj"].html(CONFIG["fragments"]["panel"]["ctrl"]["dispose"](CONFIG["fragments"]["panel"]["fragment"]));
		_options.innerHTML = '<input type="button" name="send" value="send"/><input type="button" name="cancel" value="cancel"/>';
		CONFIG["fragments"]["panel"]["obj"].append(_options);
		_send = $$($$.selectElements("input[type=button][name=send]",_options));
		_cancel = $$($$.selectElements("input[type=button][name=cancel]",_options));
		
		if (CONFIG["fragments"]["panel"]["ctrl"]["onDispose"])CONFIG["fragments"]["panel"]["ctrl"]["onDispose"](CONFIG["fragments"]["panel"]["obj"].elements[0]);
		
		_send.on("click",function(e,obj){
			//console.log("send")
			_panel = CONFIG["fragments"]["panel"]["obj"].elements[0];
			var renderFragments = function(){
				_html = CONFIG["fragments"]["panel"]["ctrl"]["render"]();
				var _values = CONFIG["fragments"]["panel"]["ctrl"]["values"]();
				for (_val in _values){
					_values[_val] = _values[_val](_panel);
					_repl = new RegExp('{'+_val+'}',"g");
					_html = _html.replace(_repl,_values[_val].value);
				};
				
				_data = {
					"page":CONFIG["page"],
					"fragment": {
						"ref": CONFIG["refs"]["controller"]
						, "id": $$.getAttributes(CONFIG["fragments"]["panel"]["ref"],CONFIG["refs"]["editor"])[CONFIG["refs"]["editor"]]
						, "html": _html.replace(/"/g,'\\"')
					}
				};
				
				$$.send({
					"method" : "POST",
					"url" : CONFIG["site"]["API"]["editor"],
					"data": _data,
					"error" : function(data) {
						//console.log("error",data);
					},
					"success": function(data){
						data = eval('(' + data + ')');
						CONFIG["fragments"]["controllers"].html(data["fragment"],{elements:[CONFIG["fragments"]["panel"]["fragment"]]});
						if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
						
						var _pair = this
							, _images = $$.selectElements("img",this["controller"])
							, _cnt = _images.length
						;
						if (_cnt){
							$$.loopEach(_images,function(){
								this.onload = function(a){
									_cnt--;
									if (!_cnt) renderFragmentsOverlays();
								};
							});
						}
						renderFragmentsOverlays();
					}
				});
				//_dataBody = _data.fragment.html;
			};
			if (CONFIG["fragments"]["panel"]["ctrl"]["onRender"])CONFIG["fragments"]["panel"]["ctrl"]["onRender"](CONFIG,renderFragments);
			else renderFragments();
		});
		
		_cancel.on("click",function(e,obj){
			if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
		});
	};
	
	var renderFragmentsOverlays = function() {
		var _coords;
		$$.loopEach(CONFIG["fragments"]["pairs"], function() {
			_coords = $$.getCoords(this["controller"]);
			$$.setStyle(this["editor"], {
				"height" : (_coords[2][1] - _coords[0][1]).toString() + "px",
				"width" : (_coords[1][0] - _coords[0][0]).toString() + "px",
				"left" : _coords[0][0].toString() + "px",
				"top" : _coords[0][1].toString() + "px"
				/*, "position": "absolute"
				 , "border": "1px solid red"*/
			});
		});
	};

	var setFragmentsModal = function() {
		destroyOBJ(CONFIG["fragments"],"modal");
		var _modal = document.createElement("DIV");
		document.body.appendChild(_modal);
		_modal = $$(_modal);
		_modal.css({
			"height" : "0px",
			"width" : "100%",
			"left" : "0",
			"top" : "0",
			"position" : "absolute"
		});
		_modal.attr({
			"id" : CONFIG["refs"]["modal"]
		});
		CONFIG["fragments"]["modal"] = _modal;
		return CONFIG["fragments"]["modal"];
	};

	var setFragments = function() {
		destroyOBJ(CONFIG["fragments"],"overlay");
		CONFIG["fragments"]["pairs"] = [];
		var _modal = setFragmentsModal(), _element, _overlays = [], _attr;
		CONFIG["fragments"]["controllers"] = $$(selectFragments());
		CONFIG["fragments"]["controllers"].each(function(i) {
			_element = document.createElement("DIV");
			$$.setStyle(_element, {
				"position" : "absolute"
				, "border" : "1px solid red"
				, "cursor": "pointer"
				, "background-color": "#F1F1F1"
				, "opacity": "0.4"
				, "filter": "alpha(opacity=40)"
			});
			_attr = {};
			_attr[CONFIG["refs"]["editor"]] = $$.getAttributes(this,CONFIG["refs"]["controller"])[CONFIG["refs"]["controller"]];
			$$.setAttributes(_element, _attr);
			_modal.append(_element);
			_overlays.push(_element);
			CONFIG["fragments"]["pairs"].push({
				"controller" : this,
				"editor" : _element
			});
		});
		if (_overlays.length > 0) {
			renderFragmentsOverlays();
			CONFIG["fragments"]["overlay"] = $$(_overlays);

			CONFIG["fragments"]["overlay"].on("mouseover", function(e, obj) {
				obj.css({"opacity": "0.8", "filter": "alpha(opacity=80)"}, {elements:[this]});
			});
			CONFIG["fragments"]["overlay"].on("mouseout", function(e, obj) {
				obj.css({"opacity": "0.4", "filter": "alpha(opacity=40)"}, {elements:[this]});
			});
			CONFIG["fragments"]["overlay"].on("click", function(e, obj) {
				if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
				else {
					_element = document.createElement("DIV");
					$$.setStyle(_element, {
						"width": "500px"
						//, "height": "700px"
						, "margin": "30px -250px"
						, "position": "fixed"
						, "left": "50%"
						, "right": "50%"
						, "border" : "1px solid red"
						, "background-color": "#F1F1F1"
					});
					_attr = {};
					_attr["id"] = CONFIG["refs"]["panel"];
					$$.setAttributes(_element, _attr);
					_modal.append(_element);
					CONFIG["fragments"]["panel"]["ref"] = this;
					CONFIG["fragments"]["panel"]["obj"] = $$(_element);
					$$.loopEach(CONFIG["fragments"]["pairs"], function() {
						if (this["editor"]==CONFIG["fragments"]["panel"]["ref"]){
							CONFIG["fragments"]["panel"]["fragment"] = this["controller"];
							return false;
						}
					});
					setModalPanel();
				}
			});
		}
		window.onresize = renderFragmentsOverlays;
	};
	
	var setPageConfig = function(params){
		var _isPhisicalRequest = arguments.length==2?arguments[1]:false;
		var _listen = new IO.installTo()
			, _on$$Created = function(){
				var _setPage = function(page,msg){
					var _controllers = []
						, _fragments
						, _page
						, i
						, ic
						, _controller
						, _location = window.location.pathname;
					CONFIG["page"] = page;
					if (CONFIG["page"]["phisical"]===undefined || CONFIG["page"]["phisical"].replace(/ /g).length==0) CONFIG["page"]["phisical"] = _location; 
					for (i in CONFIG["page"]["fragments"]){
						if (!$$.isInArray(_controllers,CONFIG["page"]["fragments"][i])) _controllers.push(CONFIG["page"]["fragments"][i]);
					}
					ic = i = _controllers.length;
					CONFIG["controllers"] = undefined;
					while(i--){
						(function(ctrl){
							$$.send({
								"method" : "GET",
								"url" : "../cms/controllers/"+ctrl,
								"error" : function(data) {
									ic--;
								},
								"success" : function(data) {
									_controller = {};
									_controller[ctrl] = eval('(' + data + ')');
									CONFIG["controllers"] = $$.extend(CONFIG["controllers"], _controller, true);
									ic--;
									if (ic==0){
										setFragments();
										//_isPhisical = true;
										if (_isPhisicalRequest){
											CONFIG["loaded"] = true;
											_listen.publish(messages[2]);
										}
									}
								}
							});	
						})(_controllers[i]);
						
					}
				};
				switch($$.getType(params)){
					case "object":
							_setPage(params);
							//CONFIG["page"] = params;
						break;
					case "string":
							var _page = CONFIG["site"]["pages"][params];
							$$.send({
								"method" : "GET",
								"url" : "../cms/pages/"+_page,
								"error" : function(data) {
									//console.log("error",data)
									if (_isPhisicalRequest){
										CONFIG["loaded"] = true;
										_listen.publish(messages[2]);
									}
								},
								"success" : function(data) {
									_page = eval('(' + data + ')');
									_setPage(_page);
								}
							});
							
						break;
				}
				_listen.unsubscribe(_isPhisicalRequest ? messages[1] : (CONFIG["loaded"] ? messages[1] : messages[2]));
			};
		if (_isPhisicalRequest)_listen.subscribe(messages[1],_on$$Created);
		else {
			if (CONFIG["loaded"]) {
				_listen.subscribe(messages[1],_on$$Created);
				_listen.publish(messages[1]);
			}
			else _listen.subscribe(messages[2],_on$$Created);
		}
		//if (window.$$!==undefined)_listen.publish("$$.created");
	};
		
	var selectFragments = function() {
		var _fragments = $$.toArray(document.body.getElementsByTagName("*")), i = _fragments.length, _ctrl;
		while (i--){
			_ctrl = $$.getAttributes(_fragments[i],CONFIG["refs"]["controller"])[CONFIG["refs"]["controller"]];
			if (_ctrl == null || CONFIG["page"]["fragments"][_ctrl]===undefined) _fragments.splice(i, 1);
		}
		return _fragments;
	};

	var getUNIRefs = function() {
		var _refs = {
			"controller" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["controller"],
			"editor" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["controller"] + "-" + CONFIG["site"]["editor"],
			"modal" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["modal"],
			"panel" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["modal"] + "-" + CONFIG["site"]["panel"]
		};
		return _refs;
	};

	var setUNIConfig = function() {
		$$.send({
			"method" : "GET",
			"url" : "../cms/site.json",
			"error" : function(data) {
				//console.log("error",data)
			},
			"success" : function(data) {

				var _site = eval('(' + data + ')'),_controllers = [], _fragments,_page,i,ic,_controller,_location = window.location.pathname,_listen = new IO.installTo();
				CONFIG["site"] = $$.extend(CONFIG["site"], _site, true);
				CONFIG["refs"] = getUNIRefs();
				_fragments = {
					"controllers" : undefined,
					"modal" : undefined,
					"overlay" : undefined,
					"pairs" : [],
					"panel": {
						"ref": undefined
						, "obj": undefined
					}
				};
				CONFIG["fragments"] = $$.extend(CONFIG["fragments"], _fragments, true);
				$$.setClean({cleandeep : true});
				
				if (CONFIG["site"]["pages"] && CONFIG["site"]["pages"][_location]){
					setPageConfig(_location,true);
					_listen.publish(messages[1]);
				} else {
					CONFIG["loaded"] = true;
					_listen.publish(messages[2]);
				}
			}
		});
	};
	
	var setUNIComponents = function(properties,methods){
		//add components to properties and methods 
	};
	
	var setUNILibraries = function() {
		if (window.$$ === undefined) {
			var _mjzCallback = function() {
					appendStyle({
						"path" : "../cms/mjz2/css/mjz.css",
						"id" : "mjz2-movements-css",
						"cont" : document.getElementsByTagName("HEAD")[0]
					});
					appendScript({
						"path" : "../cms/mjz2/js/mjz2-movements.js",
						"id" : "mjz2-movements-script",
						"cont" : document.getElementsByTagName("HEAD")[0],
						"callback" : _mjzMovementsCallback
					});
					setUNIConfig();
				}
				, _mjzMovementsCallback = function() {
					appendScript({
						"path" : "../cms/mjz2/js/mjz2-resizing.js",
						"id" : "mjz2-resizing-script",
						"cont" : document.getElementsByTagName("HEAD")[0]
					});
					appendScript({
						"path" : "../cms/mjz2/js/mjz2-resizing.js",
						"id" : "mjz2-panel-resizing-script",
						"cont" : document.getElementsByTagName("HEAD")[0]
					});
				}
			;
			appendScript({
				"path" : "../cms/mjz2/js/mjz2.js",
				"id" : "mjz2-script",
				"cont" : document.getElementsByTagName("HEAD")[0],
				"callback" : _mjzCallback
			});
		} else setUNIConfig();
	};

	var setUNIMethods = function() {
		var _methods = {
			"selectFragments" : selectFragments
			, "setPageConfig": setPageConfig
			, "config" : function() {
				return CONFIG;
			}
		};
		return _methods;
	};

	var setUNIProperties = function() {
		var _properties = {
			"IO" : IO
		};
		return _properties;
	};

	var create = function() {
		if (UNI === undefined) {
			var _select = {}, _methods = {}, _properties = {}, m, p;
			setUNILibraries();
			_methods = setUNIMethods();
			_properties = setUNIProperties();
			setUNIComponents(_properties,_methods);
			for (m in _methods)
			_select[m] = _methods[m];
			for (p in _properties)
			_select[p] = _properties[p];
			_methods = _properties = m = p = null;
			return _select;
		}
	};

	return create();
}
)(UNI);
