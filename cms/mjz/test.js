var htmlEvents = {// list of real events
    //<body> and <frameset> Events
    onload:1,
    onunload:1,
    //Form Events
    onblur:1,
    onchange:1,
    onfocus:1,
    onreset:1,
    onselect:1,
    onsubmit:1,
    //Image Events
    onabort:1,
    //Keyboard Events
    onkeydown:1,
    onkeypress:1,
    onkeyup:1,
    //Mouse Events
    onclick:1,
    ondblclick:1,
    onmousedown:1,
    onmousemove:1,
    onmouseout:1,
    onmouseover:1,
    onmouseup:1
}
function triggerEvent(el,eventName){
    var event;
    if(document.createEvent){
        event = document.createEvent('HTMLEvents');
        event.initEvent(eventName,true,true);
    }else if(document.createEventObject){// IE < 9
        event = document.createEventObject();
        event.eventType = eventName;
    }
    event.eventName = eventName;
    if(el.dispatchEvent){
        el.dispatchEvent(event);
    }else if(el.fireEvent && htmlEvents['on'+eventName]){// IE < 9
        el.fireEvent('on'+event.eventType,event);// can trigger only real event (e.g. 'click')
    }else if(el[eventName]){
        el[eventName]();
    }else if(el['on'+eventName]){
        el['on'+eventName]();
    }
}
function addEvent(el,type,handler){
    if(el.addEventListener){
        el.addEventListener(type,handler,false);
    }else if(el.attachEvent && htmlEvents['on'+type]){// IE < 9
        el.attachEvent('on'+type,handler);
    }else{
        el['on'+type]=handler;
    }
}
function removeEvent(el,type,handler){
    if(el.removeventListener){
        el.removeEventListener(type,handler,false);
    }else if(el.detachEvent && htmlEvents['on'+type]){// IE < 9
        el.detachEvent('on'+type,handler);
    }else{
        el['on'+type]=null;
    }
}

var _body = document.body;
var customEventFunction = function(){
    alert('triggered custom event');
}
// Subscribe
addEvent(_body,'customEvent',customEventFunction);
// Trigger
triggerEvent(_body,'customEvent');