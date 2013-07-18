var API = {
	$$list_form: null
	, $$list_form_items: null
	, $$list_form_actions: null
	, $$list_collection: null
	
	, addCollectionItem: function(list){
		var new_list_item = document.createElement("LI");
		new_list_item.innerHTML = list["name"];
		this.$$list_collection.elements[0].appendChild(new_list_item);
		$$(new_list_item).on("click",function(e,obj){
			$$(API.$$list_form.elements[0].elements["reset"]).trigger("click");
			API.addActionItems("save","Save",list);
			API.addActionItems("delete","Delete",list);
			API.sendListSelect(list["_id"]);
		});
	}

	, addActionItems: function(action,value,list){
		var new_list_item = document.createElement("LI");
		this.$$list_form_actions.elements[0].appendChild(new_list_item);
		var new_list_item_input = document.createElement("INPUT");
		$$.core.setAttributes(new_list_item_input,{
			"name": action
			, "id": action
			, "type": "button"
			, "value": value
		})
		new_list_item.appendChild(new_list_item_input)
		$$(new_list_item_input).on("click",function(e,obj){
			if (action=="save"){
				API.sendListSave(list["_id"]);
			} else if(action=="delete"){
				API.sendListDelete(list["_id"]);
			}
		});
	}
	
	, socket: io.connect()
	, sendListsOrderTop: function(params){
		params = params || {};
		console.log("emit","lists-select-order_top",params);
		this.socket.emit("lists-select-order_top",params);
	}
	, sendListSelect: function(list_id){
		console.log("emit","list-select",list_id);
		this.socket.emit("list-select",list_id);
	}
	, sendListCreate: function(){
		var _elms = this.$$list_form.elements[0].elements
		, i = _elms.length
		, list = {"name":null,"items":[]}
		;
		while(i--) {
			if (_elms[i].name=="item" && _elms[i].value.replace(/ /g,"")!="") list["items"].unshift(_elms[i].value);
			else if (_elms[i].name=="name" && _elms[i].value.replace(/ /g,"")!="") list["name"] = _elms[i].value;
		}
		console.log("emit","list-create",list);
		this.socket.emit("list-create",list);
	}
	, sendListSave: function(list_id){
		var _elms = this.$$list_form.elements[0].elements
		, i = _elms.length
		, list = {"name":null,"items":[],"_id":list_id}
		;
		while(i--) {
			if (_elms[i].name=="item" && _elms[i].value.replace(/ /g,"")!="") list["items"].unshift(_elms[i].value);
			else if (_elms[i].name=="name" && _elms[i].value.replace(/ /g,"")!="") list["name"] = _elms[i].value;
		}
		console.log("emit","list-save",list);
		this.socket.emit("list-save",list);
	}
	, sendListDelete: function(list_id){
		console.log("emit","list-delete",list_id);
		this.socket.emit("list-delete",list_id);
	}
	
	, setBroadcasting: function(){
		this.socket.on("lists-selected-order_top",function(lists){
			var _list;
			while(_list=lists.shift()){
				API.addCollectionItem(_list);
			}
		});
		this.socket.on("list-selected",function(list){
			console.log(list)
			var _items = list["items"]
			, _elms = API.$$list_form.elements[0].elements
			, i = _elms.length
			, _elm_id
			;
			API.$$list_form.elements[0].elements["name"].value = list["name"];
			while(i--){
				if(_elms[i].id && _elms[i].name=="item"){
					_elm_id = _elms[i].id.replace("item","");
					if (!isNaN(_elm_id)){
						_elm_id = parseInt(_elm_id,10);
						if (_items.length>_elm_id) _elms[i].value = _items[_elm_id];
					}
				}
			}
		});
		this.socket.on("list-created",function(list){
			API.addCollectionItem(list);
		});
		this.socket.on("list-saved",function(list){
			$$(API.$$list_form.elements[0].elements["reset"]).trigger("click");
		});
		
		this.socket.on("list-deleted",function(list){
			$$(API.$$list_form.elements[0].elements["reset"]).trigger("click");
		});
	}
}