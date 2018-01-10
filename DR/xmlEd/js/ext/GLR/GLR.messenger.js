
GLR.messenger = (function(){
												
	GLR.applyCSS("GLR.messenger.css");
	
	var _elemId      = "messenger";
	var _$elem       = null;
	var _initialized = false;
	var _fadeTimeoutId;
	
	var _exists = function(){
		return ( !!$("#"+_elemId).length );
	};
		
	var _init = function(){
		if (!_exists()){
			$("<div id='"+_elemId+"'><table id='msg'><tr><td id='msgBody'><div>"+_props.msg+"</div></td><td id='msgRightEdge'></td></tr></table></div>").appendTo("body");
			_$elem = $("#"+_elemId);
		}
		clearTimeout(_fadeTimeoutId);
		_$elem.stop().css({"opacity":"1"}).removeClass();
	};
	
	var _props = {
		msg   : "",
		mode  : "default",  // loading | error | ready | success
		speed : 1000  // fade speed
	};
	
	var _self = {
		
		/* adjusts top of messenger so its visible regardless of scroll position */
		adjustPosition: function(){ 
			if (_exists() && $.browser.msie && $.browser.version < 7){
				_$elem.css({top:$(window).scrollTop()+"px"});
			}
		},
		
		/* display Messenger with specified message */
		show: function(props){
			_init();
			if (typeof props=="string"){ 
				var msg = props;
				props = {msg:msg};
			}
			$.extend(_props, props);
			_$elem.find("div").html(_props.msg);			
			_$elem.addClass(_props.mode);
			_self.adjustPosition();
		},
		
		/* display passed message and hide/fade */
		hide: function(props, callback){
			_init();
			$.extend(_props, props);
			_$elem.find("div").html(_props.msg);
			_$elem.addClass(_props.mode);
			_fadeTimeoutId = setTimeout(function(){_$elem.fadeOut(function(){
				$(this).remove();
				if (typeof callback == "function") callback();
			});}, _props.speed);
		},
		
		inform: function(props, callback){
			_self.hide(props, callback);
		},
		
		/* show, then hide Messenger. basically an "inform" type function */
		showAndHide: function(props, callback){
			_self.show(props);
			_self.hide(props, callback);
		}

	}
	return _self;

})();

if ($.browser.msie && $.browser.version < 7){
	$(document).ready(function(){
		$(window).scroll(GLR.messenger.adjustPosition);
		$(window).resize(GLR.messenger.adjustPosition);
	});
}	
