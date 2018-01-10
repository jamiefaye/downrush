
if (!GLR){

	var GLR = (function(){
	
		if (typeof $ == "undefined"){ throw new Error("jQuery must be available."); }
		
		if (!window.console||!console.firebug){
			var methods = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
			window.console = {};
			for (var i=0; i<methods.length; i++){ window.console[methods[i]] = function(){}; }
		}
		
		var _GLR_DIR         = "js/ext/GLR/";
		var _GLR_DIR_CSS     = _GLR_DIR + "css/";
		var _includedScripts = [];
		var _includedStyles  = [];
		
		var _self = {
	
			require: function(){
				var scriptPath;
				var curLibObject;
				for (var i=0, total=arguments.length; i<total; i++){
					scriptPath   = (arguments[i].charAt(0)!="/") ? _GLR_DIR + arguments[i] : arguments[i];
					curLibObject = eval(_self.string.getPathInfo(scriptPath).file);
					if ($.inArray(scriptPath, _includedScripts) == -1 && typeof curLibObject != "object"){ // if object (library) hasn't been imported ...
						$.ajax({ type:"GET", url:scriptPath, dataType:"script", async:false, cache:true }); // import it
						_includedScripts.push(scriptPath);
					}
				}
			},
			
			applyCSS: function(){
				var stylePath;
				for (var i=0, total=arguments.length; i<total; i++){
					stylePath = (arguments[i].charAt(0)!="/") ? _GLR_DIR_CSS + arguments[i] : arguments[i];
					if ($.inArray(stylePath, _includedStyles) == -1){
						$("<link rel='stylesheet' type='text/css' href='"+stylePath+"'/>").appendTo("head");
						_includedStyles.push(stylePath);
					}
				}
			},

			beget: function(obj){
				if (typeof(obj)=="object" && obj!==null){
					var F = function(){};
					F.prototype = obj;
					return new F();
				}
				else {
					throw new Error("GLR.beget() was called with an invalid or null argument. (Object expected)");
				}
			
			},
				
			/* STRING utilities */		
			string: {
				isEmpty:      function(str){ if (typeof(str)==="string"){ return !/\w+/.test(str); }},
				isNumeric:    function(str){ if (typeof(str)==="string"){ return /^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/.test(str); }},
				isValidEmail: function(str){ return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(str)); },
				stripHtml:    function(str){ return str.replace(/(<([^>]+)>)/ig,""); },
				getPathInfo:  function(str){ var m = str.match(/(.*)[\/\\]([^\/\\]+)\.\w+$/); return {path:m[1], file:m[2]}; }
			},
			
			browser: {
				isWin: window.navigator.platform.toLowerCase().indexOf('win') != -1 ? 1:0,
				isMac: window.navigator.platform.toLowerCase().indexOf('mac') != -1 ? 1:0				
			},
			
			win: {
				getWidth  : function(){ return $.browser.safari ? document.documentElement.clientWidth  : $(window).width(); },
				getHeight : function(){ return $.browser.safari ? document.documentElement.clientHeight : $(window).height(); }
			},
			
			/** removeFilter() is used to remove Internet Explorer's "filter" attribute 
			* in situations where it disables the ClearType setting, for example during fadeIn().  
			* By removing the attribute, ClearType is re-enabled.
			*/
			removeFilter: function(elem){
				if ($.browser.msie) { elem.style.removeAttribute("filter"); }
			}

		};
		
		return _self;
	
	})();
	

	jQuery.fn.extend({
									 
		/* resizeEnd binds a new resize handler to window object.  for IE and Safari handler is executed on resize completion */
		resizeEnd: function(newHandler){

			$(this).resize(function(){
				var handlerCode = newHandler.toString();
				if ($.browser.msie || $.browser.safari){             // handle after resize operation is complete (once)
					if (!GLR.resizeTimeout){ GLR.resizeTimeout = {}; } // initiate GLR.resizeTimeout
					if (GLR.resizeTimeout[handlerCode] !== null){      // if handler exists...
						clearTimeout(GLR.resizeTimeout[handlerCode]);    // clear timeout since it will be re-assigned later, if need be
					}
					GLR.resizeTimeout[handlerCode] = setTimeout(newHandler, 300); // wait before calling handleResize, unless its been reset by a further resize actiong IE or Safari;
				}
				else { 
					newHandler();			
				}
			});										
			
		}
	});
	
}
