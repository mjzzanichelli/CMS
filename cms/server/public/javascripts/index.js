$$.core.ready(function(){
	API.$$list_form = $$(document.getElementById("ListForm"));
	API.$$list_form_items = $$(document.getElementById("ListFormItems"));
	API.$$list_form_actions = $$(document.getElementById("ListFormActions"));
	API.$$list_collection = $$(document.getElementById("ListCollection"));
	API.setBroadcasting();
	API.sendListsOrderTop({"order":-1,"limit":5});
	$$(API.$$list_form.elements[0].elements["create"]).on("click",function(){
		API.sendListCreate();
	});
	$$(API.$$list_form.elements[0].elements["reset"]).on("click",function(){
		var _elms = API.$$list_form.elements[0].elements
		, i = _elms.length
		;
		while(i--){
			if (_elms[i].name=="item" || _elms[i].name=="name") _elms[i].value="";
			else if(_elms[i].name=="save" || _elms[i].name=="delete") $$(_elms[i].parentNode).remove();
		}
	});
});