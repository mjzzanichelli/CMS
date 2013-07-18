var UNI = (function() {
	var CONFIG = {
		"site" : {
			"ext" : "cms"//global prefix
			, "controller" : "id"//suffix for controllers attribute >> ext-controller
			, "editor" : "ref"//suffix for controllers editor attribute >> ext-controller-editor
			, "modal" : "modal"//suffix for modal ID >> ext-modal
			, "panel": "panel" //suffix for modal panel ID >> ext-modal-panel
			, "pages" : undefined
		}
		, "page" : undefined
		, "controllers": undefined
	};
	var IO = ( function() {
			var subscribe = function(msg, fn, prev) {
				if (!IO.notes[msg])
					IO.notes[msg] = [];
				var message = {
					context : this,
					callback : fn
				}
				if (prev)
					for (var i = 0, l = IO.notes[msg].length; i < l; i++)
						if (message.context && IO.notes[msg][i].context != message.context)
							message.callback.apply(message.context, IO.notes[msg][i].arguments)
				IO.notes[msg].push(message);
				return this;
			};

			var unsubscribe = function(msg, fn) {
				if (IO.notes[msg]) {
					var i = IO.notes[msg].length, subscription;
					while (i--) {
						subscription = IO.notes[msg][i];
						if (subscription.context == this) {
							if (fn === undefined || (fn && fn == subscription.callback))
								IO.notes[msg].splice(i, 1)
						}
					}
					i = subscription = null;
				}
			};

			var publish = function(msg) {
				if (!IO.notes[msg])
					return false;
				var args = Array.prototype.slice.call(arguments, 1), subscription, i = IO.notes[msg].length;
				while (i--) {
					subscription = IO.notes[msg][i];
					subscription.arguments = args;
					//console.log(subscription.context)
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
					obj.subscribe = subscribe;
					obj.unsubscribe = unsubscribe;
					obj.publish = publish;
					obj.setValue = setValue;
				}
			};
		}());

	var loadFile = function(params) {
		params = $$.core.extend({
			"method" : "GET"
			, "dataType": "application/x-www-form-urlencoded"
		}, params, true)
		if (params["url"]) {
			var xmlhttp;
			if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			} else {// code for IE6, IE5
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4) {
					if (xmlhttp.status == 200)
						if (params["success"])
							params["success"](xmlhttp.responseText)
						else {
							if (params["error"])
								params["error"](xmlhttp);
						}
				} else if (xmlhttp.readyState == 2 && xmlhttp.status !== 200 && params["error"])
					params["error"]
			}
			try {
				xmlhttp.open(params["method"], params["url"], true);
				if (params["method"].toUpperCase()=="POST" && params["data"]){
					xmlhttp.setRequestHeader("Content-type",params["dataType"]);
					//console.log($$.core.stringify(params["data"]))
					xmlhttp.send($$.core.stringify(params["data"]));
				} else xmlhttp.send();
			} catch(e) {
				if (params["error"])
					params["error"](e)
			}
		}
	};

	var appendScript = function(params) {
		if (params && params["path"]) {
			var _script = document.createElement("SCRIPT"), _cont = params["cont"] || document.getElementsByTagName("HEAD")[0];
			_script.src = params["path"];
			_script.type = "text/javascript";
			if (params["id"])
				_script.id = params["id"];
			if (params["callback"]) {
				_script.onreadystatechange = function() {
					if (this.readyState == 'complete')
						params["callback"]();
				}
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
					if (this.readyState == 'complete')
						params["callback"]();
				}
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
			, _controller = $$.core.getAttributes(CONFIG["fragments"]["panel"]["ref"],CONFIG["refs"]["editor"])[CONFIG["refs"]["editor"]]
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
		_send = $$(selectElements("input[type=button][name=send]",_options));
		_cancel = $$(selectElements("input[type=button][name=cancel]",_options));
		
		if (CONFIG["fragments"]["panel"]["ctrl"]["onDispose"])CONFIG["fragments"]["panel"]["ctrl"]["onDispose"](CONFIG["fragments"]["panel"]["obj"].elements[0]);
		
		_send.on("click",function(e,obj){
			//console.log("send")
			_panel = CONFIG["fragments"]["panel"]["obj"].elements[0]
			_html = CONFIG["fragments"]["panel"]["ctrl"]["render"]();
			var _values = CONFIG["fragments"]["panel"]["ctrl"]["values"]();
			for (_val in _values){
				_values[_val] = _values[_val](_panel);
				_repl = new RegExp('{'+_val+'}',"g");
				_html = _html.replace(_repl,_values[_val])
			}
			_data = {
				"page":CONFIG["page"],
				"fragment": {
					"ref": CONFIG["refs"]["controller"]
					, "id": $$.core.getAttributes(CONFIG["fragments"]["panel"]["ref"],CONFIG["refs"]["editor"])[CONFIG["refs"]["editor"]]
					, "html": _html.replace(/"/g,'\\"')
				}
			}
			loadFile({
				"method" : "POST",
				"url" : "http://127.0.0.1:4000/API/Editor/",
				"data": _data,
				"error" : function(data) {
					//console.log("error",data)
				},
				"success": function(data){
					data = eval('(' + data + ')');
					CONFIG["fragments"]["controllers"].html(data["fragment"],{elements:[CONFIG["fragments"]["panel"]["fragment"]]})
					if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
					renderFragmentsOverlays();
				}
			});
		});
		
		_cancel.on("click",function(e,obj){
			if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
		})
	};
	
	var renderFragmentsOverlays = function() {
		var _coords;
		$$.core.loopEach(CONFIG["fragments"]["pairs"], function() {
			_coords = $$.core.getCoords(this["controller"])
			$$.core.setStyle(this["editor"], {
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
		destroyOBJ(CONFIG["fragments"],"modal")
		/*if (CONFIG["fragments"]["modal"]) {
			CONFIG["fragments"]["modal"].remove();
			CONFIG["fragments"]["modal"] = null;
		}*/
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
		})
		CONFIG["fragments"]["modal"] = _modal;
		return CONFIG["fragments"]["modal"];
	};

	var setFragments = function() {
		destroyOBJ(CONFIG["fragments"],"overlay")
		/*if (CONFIG["fragments"]["overlay"]) {
			CONFIG["fragments"]["overlay"].remove();
			CONFIG["fragments"]["overlay"] = null;
			CONFIG["fragments"]["pairs"] = [];
		}*/
		var _modal = setFragmentsModal(), _element, _overlays = [], _attr;
		CONFIG["fragments"]["controllers"].each(function(i) {
			_element = document.createElement("DIV");
			$$.core.setStyle(_element, {
				"position" : "absolute"
				, "border" : "1px solid red"
				, "cursor": "pointer"
				, "background-color": "#F1F1F1"
				, "opacity": "0.4"
				, "filter": "alpha(opacity=40)"
			});
			_attr = {};
			_attr[CONFIG["refs"]["editor"]] = $$.core.getAttributes(this,CONFIG["refs"]["controller"])[CONFIG["refs"]["controller"]]
			$$.core.setAttributes(_element, _attr)
			_modal.append(_element)
			_overlays.push(_element);
			CONFIG["fragments"]["pairs"].push({
				"controller" : this,
				"editor" : _element
			})
		})
		if (_overlays.length > 0) {
			renderFragmentsOverlays();
			CONFIG["fragments"]["overlay"] = $$(_overlays);

			CONFIG["fragments"]["overlay"].on("mouseover", function(e, obj) {
				obj.css({"opacity": "0.8", "filter": "alpha(opacity=80)"}, {elements:[this]});
			})
			CONFIG["fragments"]["overlay"].on("mouseout", function(e, obj) {
				obj.css({"opacity": "0.4", "filter": "alpha(opacity=40)"}, {elements:[this]});
			})
			CONFIG["fragments"]["overlay"].on("click", function(e, obj) {
				if (CONFIG["fragments"]["panel"]["obj"]) destroyOBJ(CONFIG["fragments"]["panel"],"obj");
				else {
					_element = document.createElement("DIV");
					$$.core.setStyle(_element, {
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
					_attr["id"] = CONFIG["refs"]["panel"]
					$$.core.setAttributes(_element, _attr)
					_modal.append(_element);
					CONFIG["fragments"]["panel"]["ref"] = this;
					CONFIG["fragments"]["panel"]["obj"] = $$(_element);
					$$.core.loopEach(CONFIG["fragments"]["pairs"], function() {
						if (this["editor"]==CONFIG["fragments"]["panel"]["ref"]){
							CONFIG["fragments"]["panel"]["fragment"] = this["controller"];
							return false;
						}
					});
					setModalPanel();
				}
			})
		}
		window.onresize = renderFragmentsOverlays;
	};
	
	var getElementsByPseudo = function(elms,pseudo){
		//console.log(pseudo)
		var i=elms.lengths;
		if (isNaN(pseudo)){
			switch(pseudo){
				case "first":
					break;
				case "last":
					break;
			}
		}
		return elms;
	}
	
	var getElementsByClassName = function(elms, className){
		var i = elms.length;
		while (i--)
		if (!$$.core.hasClass(elms[i],className))
			elms.splice(i, 1)
		return elms;
	};
	
	
	var getElementsByAttributeValue = function(elms, attr,value){
		var i = elms.length;
		while (i--)
		if ($$.core.getAttributes(elms[i],attr)[attr]!==value)
			elms.splice(i, 1)
		return elms;
	};
	
	
	var setSeparatorAction = function(string,sep) {
		var _idxs = setSelectionIndexes(string)
			, _sep = {
				"sep":string
				, "idx": 0
			}
			, _action
			, _value = string
		if (_idxs["separator"]){
			_sep = _idxs["separator"];
			if (_sep["idx"]>0)_value = _value.substring(0,_sep["idx"]);
		}
		switch(sep["sep"]){
			case "#":
				_action = function(elms){
					var _elements = getElementsByAttributeValue(elms,"id",_value);
					return _elements;
				}
				break;
			case ".":
				_action = function(elms){
					var _elements = getElementsByClassName(elms,_value);
					return _elements;
				}
				break;
			case "]":
				_action = function(elms){
					return elms;
				}
				break;
			case "[":
				_action = function(elms){
					var 
						_value_arr = _value.split("=")
						, _elements = getElementsByAttributeValue(elms,_value_arr[0],_value_arr[1].toString())
					;
					return _elements;
				}
				break;
			case ":":
				_action = function(elms){
					var _elements = getElementsByPseudo(elms,string);
					return _elements;
				}
				break;
			/*case ">":
				_action = function(elms){
					return elms;
				}
				break;*/
		}
		return {"action": _action, "string":string.substring(_sep["idx"]+_sep["sep"].length), "sep": _sep} 
	};
	
	var setSelectionIndexes = function(string) {
		var _idxs = {
			".": null
			,"#": null
			,"[": null
			,"]": null
			,":": null
			//,">": null
		}
		, _sep
		, _idx
		
		for (_sep in _idxs) {
			_idxs[_sep] = string.indexOf(_sep);
			if (_idxs[_sep] >= 0 && (_idx=== undefined || _idxs[_sep]<_idx["idx"]))_idx = {"sep": _sep,"idx":_idxs[_sep]};
		}
			
		return {
			"indexes": _idxs
			, "separator": _idx  
		}
	};
	
	var selectElements = function(selector,container) {
		var 
			_selector_arr = $$.core.trim(selector).split(" ")
			, _container = container || document
			, i = 0
			, ii
			, l = _selector_arr.length
			, ll
			, _sel
			, _idxs
			, _sep
			, _dom_type
			, _actions
			, _elements = []
			, _separator
		;
		_container = ($$.core.isArray(_container) ? _container : [_container]);
		for (;i<l;i++){
			if (!_container.length) break;
			_sel = _selector_arr[i].replace(/ /g,"");
			if (_sel.length>0){
				_idxs = setSelectionIndexes(_sel)
				_elements = [];
				_actions = [];
				_dom_type = "*";
				if (_idxs["separator"]){
					_sep = _idxs["separator"];
					if (_sep["idx"]>0)_dom_type = _sel.substring(0,_sep["idx"]);
					_sel = _sel.substring(_sep["idx"]+_sep["sep"].length)
					_separator = setSeparatorAction(_sel,_sep);
					_sel = _separator["string"];
					_sep = _separator["sep"];
					_actions.push(_separator["action"]);
					while(_sel.length){
						_separator = setSeparatorAction(_sel,_sep);
						if (_sel==_separator["string"])break;
						_sel = _separator["string"];
						_sep = _separator["sep"];
						_actions.push(_separator["action"]);
					}
				} else _dom_type = _sel;
				ii = 0;
				ll = _container.length;
				for (;ii<ll;ii++) _elements = _elements.concat($$.core.toArray(_container[ii].getElementsByTagName(_dom_type)))
				ii = 0;
				ll = _actions.length;
				for (;ii<ll;ii++) if (_elements.length) _elements = _actions[ii](_elements);
			}
			_container = _elements
		}
		return _elements
	};
		
	var selectFragments = function() {
		var _fragments = $$.core.toArray(document.body.getElementsByTagName("*")), i = _fragments.length;
		while (i--)
		if ($$.core.getAttributes(_fragments[i],CONFIG["refs"]["controller"])[CONFIG["refs"]["controller"]] == null)
			_fragments.splice(i, 1)
		return _fragments
	};

	var getUNIRefs = function() {
		var _refs = {
			"controller" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["controller"],
			"editor" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["controller"] + "-" + CONFIG["site"]["editor"],
			"modal" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["modal"],
			"panel" : CONFIG["site"]["ext"] + "-" + CONFIG["site"]["modal"] + "-" + CONFIG["site"]["panel"]
		}
		return _refs;
	};

	var setUNIConfig = function() {
		
		/*var _elm = selectElements("div[cms-id=test-text].class#id:pseudo")
		console.log(_elm)*/
		
		loadFile({
			"method" : "GET",
			"url" : "../cms/site.json",
			"error" : function(data) {
				//console.log("error",data)
			},
			"success" : function(data) {

				var _site = eval('(' + data + ')'),_controllers = [], _fragments,_page,i,ic,_controller,_location = window.location.pathname;
				CONFIG["site"] = $$.core.extend(CONFIG["site"], _site, true);
				CONFIG["refs"] = getUNIRefs();
				_fragments = {
					"controllers" : $$(selectFragments()),
					"modal" : undefined,
					"overlay" : undefined,
					"pairs" : [],
					"panel": {
						"ref": undefined
						, "obj": undefined
					}
				}
				CONFIG["fragments"] = $$.core.extend(CONFIG["fragments"], _fragments, true)
				$$.core.setClean({cleandeep : true});
				
				if (CONFIG["site"]["pages"] && CONFIG["site"]["pages"][_location]){
					_page = CONFIG["site"]["pages"][_location];
					loadFile({
						"method" : "GET",
						"url" : "../cms/pages/"+_page,
						"error" : function(data) {
							//console.log("error",data)
						},
						"success" : function(data) {
							CONFIG["page"] = eval('(' + data + ')');
							if (CONFIG["page"]["phisical"]===undefined || CONFIG["page"]["phisical"].replace(/ /g).length==0) CONFIG["page"]["phisical"] = _location; 
							for (i in CONFIG["page"]["fragments"]){
								if (!$$.core.isInArray(_controllers,CONFIG["page"]["fragments"][i])) _controllers.push(CONFIG["page"]["fragments"][i]);
							}
							ic = i = _controllers.length;
							while(i--){
								(function(ctrl){
									loadFile({
										"method" : "GET",
										"url" : "../cms/controllers/"+ctrl,
										"error" : function(data) {
											//console.log("error",data)
										},
										"success" : function(data) {
											_controller = {}
											_controller[ctrl] = eval('(' + data + ')');
											CONFIG["controllers"] = $$.core.extend(CONFIG["controllers"], _controller, true)
											ic--;
											if (ic==0){
												setFragments();
												//console.log("CONFIG",CONFIG);
											}
										}
									});	
								})(_controllers[i])
								
							}
						}
					});
				}
			}
		})
	};

	var setUNILibraries = function() {
		if (window.$$ === undefined) {
			var _mjzMovementsCallback = function() {
				appendScript({
					"path" : "../cms/mjz/js/mjz-resizing.js",
					"id" : "mjz-movements",
					"cont" : document.getElementsByTagName("HEAD")[0]
				});
			}
			var _mjzCallback = function() {
				appendStyle({
					"path" : "../cms/mjz/css/mjz.css",
					"id" : "mjz-movements",
					"cont" : document.getElementsByTagName("HEAD")[0]
				});
				appendScript({
					"path" : "../cms/mjz/js/mjz-movements.js",
					"id" : "mjz-movements",
					"cont" : document.getElementsByTagName("HEAD")[0],
					"callback" : _mjzMovementsCallback
				});
				setUNIConfig();
			}
			appendScript({
				"path" : "../cms/mjz/js/mjz.js",
				"id" : "mjz",
				"cont" : document.getElementsByTagName("HEAD")[0],
				"callback" : _mjzCallback
			});

			appendScript({
				"path" : "../cms/mjz/js/mjz.js"
			});
		} else
			setUNIConfig();
	};

	var setUNIMethods = function() {
		var _methods = {
			"selectFragments" : selectFragments,
			"appendScript" : appendScript,
			"appendStyle" : appendStyle,
			"config" : function() {
				return CONFIG;
			}
			, "selectElements": selectElements
		}
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
)();
