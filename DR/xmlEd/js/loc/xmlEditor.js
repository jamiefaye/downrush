/*
	Copyright (c) 2010 Aleksandar Kolundzija <ak@subchild.com>
	Version 1.5

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
	
	@TODO:
	Consider spliting app into modules: Loader, Renderer, Modifier, Writer
	
	Support comment editing and creation
	
	Attribute editing/creation:
		- removal of attributes needs work
		- typing should expand field width?
		- support blur for saves?
		
	Node editing/creation:
		- create node: add support for cancel (not remove)
		- support node renaming
		- support blur for saves?
		
	- for invalid XML, present link to XML in browser window since it displays specific error
	- use GIF for logo so IE6 likes
	- add support for session based temp directories
	- better messaging
	- add support for creating a new XML document from scratch
	- DTD/XSD generation and exporting
	- auto save
	- revert option
	- support for UNDO
*/



/**
 * Loggable adds a log method to the passed object.
 * @param 	{Object}	obj  		Object which will get a new log() method
 * @param 	{String}  	objName		Optional parameter for displaying a string before each log output
 * @param 	{boolean} 	debugMode	Optional switch for disabling logging
 */
var loggable = function(obj /* , objName, debugMode */){
	var objName   = arguments[1] || "",
			debugMode = (typeof arguments[2]!=="undefined") ? arguments[2] : true;
			prefix    = objName ? objName + ": " : "";
	obj.log = (function(prefix){
		return function(){
			if (debugMode && typeof console!=="undefined"){
				if (arguments.length){
					arguments[0] = prefix + arguments[0];
				}
				console.log.apply(null, arguments);
			}
		}
	})(prefix);
	return obj;
};



/**
 * xmlEditor
 * Application for loading an XML file into memory, rendering it as an editable HTML tree,
 * and providing functionality for editing the memory copy of the file in real time. 
 * Updated XML can be converted to a string and passed to a separate process for saving.
 */
var xmlEditor = (function(){
	
	// private members
	var _nodeRefs      = [],    // will hold references to XML nodes   
		_initNodeState = "expandable",			
		_$event        = $({}), // beforeHtmlRendered, afterHtmlRendered, beforeToggleNode, afterToggleNode
		_message       = {
			"renderingHtml"     : "Rendering XML structure...",
			"readyToEdit"       : "Ready to edit.",
			"removeAttrConfirm" : "Are you sure want to delete this attribute and its value?",
			"invalidAttrName"   : "The attribute name you entered is invalid.\nPlease try again.",
			"invalidNodeName"   : "The node name you entered is invalid.\nPlease try again.",
			"noTextValue"       : "(No text value. Click to edit.)",
			"removeNodeSuccess" : "Removed node.",
			"removeNodeConfirm" : "Are you sure you want to remove this node?",
			"xmlLoadSuccess"    : "XML file was loaded successfully.",
			"xmlLoadProblem"    : "Ther was a problem loading XML file."
		};


	/**
	 * Visits every node in the DOM and runs the passed function on it.
	 * @param	{Object}	node	Starting node.
	 * @param	{Function}	func	Function to execute on starting node and all of its descendents.
	 * @TODO extend to support processing in chunks using setTimeout()s
	 * @TODO move to renderer component
	 */
	function _traverseDOM(node, func){
		func(node);
		node = node.firstChild;
		while (node){
			_traverseDOM(node, func);
			node = node.nextSibling;
		}
	}
	
	
	/**
	 * Detects whether the passed node is a comment.
	 * @param 	{Object}	node	An XML or DOM element.
	 * @return 	{Boolean}
	 */
	function _isCommentNode(node){
		return (node.nodeType===8);
	}
	

	/**
	 * Retrieves XML node using nodeIndex attribute of passed $elem
	 * @param 	{Object} 	$elem	jQuery DOM element
	 * @return 	{Object}			A DOM element
	 */	
	function _getNodeFromElemAttr($elem){
		var nodeRefIndex = $elem.closest("li.node").attr("nodeIndex"); // $elem.attr("nodeIndex");
		return _nodeRefs[nodeRefIndex];
	}	
	
	
	/**
	 * Returns a string representing path to passed node. The path is not unique 
	 * (same path is returned for all sibling nodes of same type).
	 * @param 	{Object}	node	A DOM element
	 * @return 	{String}
	 */
	function _getNodePath(node){
		var pathArray = [];
		do {pathArray.push(node.nodeName); }
		while ( (node = node.parentNode) && (node.nodeName.toLowerCase()!=="#document") );
		return (pathArray.reverse()).join(" > ").toLowerCase();
	}

	
	/**
	 * Binds custom event to private _$event object
	 * @param	{String}	Name of custom event
	 * @apram	{mixed}		Data to pass to event handler, or the handler itself (if no data is to be passed)
	 * @param 	{Function}	Handler function (Optional, if already passed as second argument)
	 */
	function _bind(eventName, dataOrFn, fnOrUndefined){
		_$event.bind(eventName, dataOrFn, fnOrUndefined);
	}


	/**
	 * Unbinds custom event from private _$event object
	 * @param	{String}	Name of custom event
	 * @param	{Function}	Handler function
	 */
	function _unbind(eventName, fn){
		_$event.unbind(eventName, fn);
	}
	
	
	/**
	 * Returns an HTML string representing node attributes
	 * @param  {Object} 	node 	DOM object
	 * @return {String}
	 */
	function _getEditableAttributesHtml(node){
		if (!node.attributes){
			return "";
		}
		var attrsHtml  = "<span class='nodeAttrs'>",
				totalAttrs = node.attributes.length;
		for (var i=0; i<totalAttrs; i++){
			attrsHtml += "<span class='singleAttr'>"+node.attributes[i].name + 
										"=\"<span class='attrValue' name='"+node.attributes[i].name+"'>" + 
										((node.attributes[i].value==="")?"&nbsp;":node.attributes[i].value) + 
										"</span>\"</span>";
		}
		attrsHtml += "<button class='addAttr icon'/></span>";
		return attrsHtml;
	}	

		
	/**
	 * Retrieves non-empty text nodes which are children of passed XML node. 
	 * Ignores child nodes and comments. Strings which contain only blank spaces 
	 * or only newline characters are ignored as well.
	 * @param  	{Object} 	node	XML DOM object
	 * @return 	{jQuery}	jQuery collection of text nodes
	 */		
	function _getTextNodes(node){
		return $(node).contents().filter(function(){ 
			return (
				((this.nodeName=="#text" && this.nodeType=="3") || this.nodeType=="4") && // text node, or CDATA node
				($.trim(this.nodeValue.replace("\n","")) !== "") // not empty
			); 
		});
	}


	/**
	 * Retrieves (text) node value
	 * @param 	{Object}	node	XML DOM object
	 * @return 	{String}
	 */
	function _getNodeValue(node){
		var $textNodes = _getTextNodes(node),
				textValue  = (node && _isCommentNode(node)) ? node.nodeValue : ($textNodes[0]) ? $.trim($textNodes[0].textContent) : "";
		return textValue;
	}
	
	
	/**
	 * Detects if passed node has next sibling which is not a text node
	 * @param 	{Object}	node	XML DOM object
	 * @return 	{mixed} 	Returns found node or false if one doesn't exist
	 */
	function _getRealNextSibling(node){
		do { node = node.nextSibling; }
		while (node && node.nodeType!==1);
		return node;
	}
	
	
	/**
	 * Toggles display by swapping class name (collapsed/expanded) and toggling
	 * visibility of child ULs.
	 * @TODO make use of setTimeouts to address delay when many children
	 * @TODO if only allowing single expanded node at a time, will need to collapse others
	 */
	function _toggleNode(){
		_$event.trigger("beforeToggleNode");
		var $thisLi = $(this);
		$thisLi.find(">ul").toggle("normal"); // animate({height:"toggle"});		
		if ($thisLi.hasClass("collapsable")){
			$thisLi.removeClass("collapsable").addClass("expandable");
		}
		else {
			$thisLi.removeClass("expandable").addClass("collapsable");
		}
		_$event.trigger("afterToggleNode");
	}


	/**
	 * Returns number of XML nodes
	 * @return	{Number}
	 * @TODO Includes text nodes.  Should it?
	 */
	function _getXmlNodeCount(){
		return $('*', _self.xml).length;
	}
	
	

	var _self = {
	
		xml        : {}, // variable will hold the XML DOM object		
		$container : $(document.body), // initialize as body, but should override with specific container
		
		
		log: function(){}, // empty function. installed via $.loggable()
		
	
		/**
		 * Assigns handlers for editing nodes and attributes. 
		 * Happens only once, during renderAsHTML()
		 */
		assignEditHandlers: function(){		
			$("#xml")
				.delegate("span.nodeName", "click", function(){ 
					_toggleNode.apply($(this).parent().get(0));
				})
				.delegate("div.hitarea", "click", function(){
					_toggleNode.apply($(this).parent().get(0));
				})
				.delegate("p.nodeValue", "click", function(){ 
					var $this = $(this), 
						node  = _getNodeFromElemAttr($this);
					_self.editValue($this, node, _getNodeValue(node));
				})
				.delegate("a.addChild", "click", function(e){
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.createChild($this, node);
				})
				.delegate("span.attrValue", "click", function(){ 
					var $this= $(this),
						node = _getNodeFromElemAttr($this);
					_self.editAttribute($this, node, $this.attr("name"), $this.text());
				})
				.delegate("button.addAttr", "click", function(e){ 
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.createAttribute($this, node);
				})
				.delegate("button.killNode", "click", function(e){
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.removeNode($this, node);
				})
				.delegate("button.icon", "mouseover", function(){
					$(this).css({opacity:1});
				})
				.delegate("button.icon", "mouseout", function(){
					$(this).css({opacity:0.5});
				})
				.delegate("li.node", "mouseover", function(){ 
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					$("#nodePath").text(_getNodePath(node));
				})
				.delegate("li.node", "mouseout", function(){ 
					$("#nodePath").empty();
				});
		},
		
		
		/**
		 * Returns HTML representation of passed node.
		 * Used during initial render, as well as when creating new child nodes.
	 	 * @param 	{Object}	node	XML DOM object
		 * @param 	{String}  	state	Ex: "expandable"
		 * @param 	{Boolean}	isLast Indicates whether there are additional node siblings
		 * @returns {String}
		 * @TODO replace anchor with button
		 */
		getNewNodeHTML: function(node, state, isLast){
			var nodeIndex    = _nodeRefs.length-1,
				nodeValue    = _getNodeValue(node),
				nodeAttrs    = _getEditableAttributesHtml(node),
				nodeValueStr = (nodeValue) ? nodeValue : "<span class='noValue'>" + _message["noTextValue"] + "</span>";
				nodeHtml     = "";
				
			if (_isCommentNode(node)){ // display comment node
				nodeHtml = '<li class="node comment '+ state + (isLast?' last':'') +'" nodeIndex="'+nodeIndex+'">' +
								'<div class="hitarea' + (isLast?' last':'') + '"/>' +
								'<span class="nodeName">comment</span><button class="killNode icon"/>' +
								'<ul class="nodeCore">' +
									'<li class="last"><p class="nodeValue">'+ nodeValueStr +'</p></li>' +
								'</ul>' +
							'</li>';
			}
			else { // display regular node
				nodeHtml = '<li class="node ' + node.nodeName + ' '+ state + (isLast?' last':'') +'" nodeIndex="'+nodeIndex+'">' +
								'<div class="hitarea' + (isLast?' last':'') + '"/>' +
								'<span class="nodeName">'+ node.nodeName +'</span>' + nodeAttrs + '<button class="killNode icon"/>' +
								'<ul class="nodeCore">' +
									'<li><p class="nodeValue">'+ nodeValueStr +'</p></li>' +
									'<li class="last"><a href="#" class="addChild">add child</a></li>' +
								'</ul>' +
							'</li>';
			}
			return nodeHtml;
		},
			
		
		/**
		 * Renders XML as an HTML structure. Uses _traverseDOM() to render each node.
		 * @see	_traverseDom
		 * @TODO Explore use of documentFragment to optimize DOM manipulation		
		 */	
		renderAsHTML: function(){
			var $parent = _self.$container.empty(),
					$trueParent,
					parentRefs = [], // hash of references to previous sibling's parents. used for appending next siblings
					parentRefIndex = 0;
			_$event.trigger("beforeHtmlRendered");					
			_nodeRefs = []; // initialize node references (clear cache)
			/**
			 * local utility method for appending a single node
			 * @param 	{Object}	node 	An XML DOM object.
			 */
			function appendNode(node){
				if (node.nodeType!==1 && !_isCommentNode(node)){ // exit unless regular node or comment
					return;
				}
				_nodeRefs.push(node); // add node to hash for future reference (cache)
				var $xmlPrevSib = $(node).prev(),
						realNextSib = _getRealNextSibling(node),
						nodeHtml    = _self.getNewNodeHTML(node, _initNodeState, !realNextSib),
						$li         = $(nodeHtml),
						$ul;
						
				_self.log(node.nodeName, parentRefIndex);
						
				if ($xmlPrevSib.length){ // appending node to previous sibling's parent
					_self.log("appending to prev sibling's parent");
					$parent = parentRefs[$xmlPrevSib.attr("parentRefIndex")];
					$xmlPrevSib.removeAttr("parentRefIndex");
					$(node).attr("parentRefIndex", parentRefIndex);
					parentRefs[parentRefIndex] = $parent;
					parentRefIndex++;
					$trueParent = $li;
					$parent.append($li);
				}
				else { // appending a new child
					_self.log("appending new child");
					if ($trueParent){
						$parent = $trueParent;
						$trueParent = false;
					}
					/*
					 @TODO: move ul.children into getNewNodeHTML(). 
					 here's how: check if $parent.find("ul.children"), if so use it, if not make root UL
					 // $ul = ($parent.find(">ul.children").length) ? $parent.find(">ul.children:first") : $("<ul class='root'></ul>");
					*/
					$ul = $("<ul class='children'></ul>").append($li); 
					$parent.append($ul);
					if (!_isCommentNode(node)){
						$parent = $li;
						$(node).attr("parentRefIndex", parentRefIndex);
						parentRefs[parentRefIndex] = $ul;
						parentRefIndex++;
					}
				}
			} // end of appendNode()
			
			_traverseDOM(_self.xml, appendNode);
			$("*", _self.xml).removeAttr("parentRefIndex"); // clean up remaining parentRefIndex-es
			_self.assignEditHandlers(); // bind in core app afterHtmlRendered
			$("button.icon").css({opacity:0.5});
			_$event.trigger("afterHtmlRendered");
		},
		
		
		/**
		 * Sets value of node to the passed text. Existing value is overwritten,
		 * otherwise new value is set.
	 	 * @param 	{Object}	node	XML DOM object
		 * @param 	{String}	value
		 */
		setNodeValue : function(node, value){
			var $textNodes = _getTextNodes(node);
			if ($textNodes.get(0)) $textNodes.get(0).nodeValue = value;
			else node["textContent"] = value;
		},
		
		
		/**
		 * Displays form for creating new child node, then processes its creation
		 * @param 	{Object} 	$link	jQuery object
	 	 * @param 	{Object}	node	XML DOM object
	 	 * @TODO need to separate this into render vs modify components
	 	 */
		createChild: function($link, node){
			var $linkParent = $link.parent(),
				$field      = $("<input type='text' value='' class='newChild'/>"),
				$submit     = $("<button class='submit'>Create Node</button>").click(processCreateChild);
				$cancel     = $("<button class='killChild cancel'>Cancel</button>").click(function(){
					$(this).remove();
					$submit.remove();
					$field.remove();					
					$link.show();
				});
			/**
			 * Private method for creating a child node.
			 */
			function processCreateChild(){
				var childNodeName = $field.val(),
					childNode,
					$parent,
					$child,
					$childName,
					$ulChildren;
				try {
					childNode = node.appendChild(_self.xml.createElement(childNodeName));
					_nodeRefs.push(childNode);
				}
				catch (e){ 
					GLR.messenger.inform({msg:_message["invalidNodeName"], mode:"error"});
					$field.val("").focus();
					return false;
				}
				$child      = $(_self.getNewNodeHTML(childNode, _initNodeState, true));
				$parent     = $linkParent.closest("li.node");
				$ulChildren = $parent.find("ul.children");
				if ($ulChildren.length){
					$ulChildren.find(">li.last").removeClass("last").find(">div.last").removeClass("last");
					$child.appendTo($ulChildren);
				}
				else {
					$parent.append("<ul class='children'></ul>");
					$ulChildren = $parent.find(">ul.children").append($child);
				}
				$child.find(">span.nodeName").css({backgroundColor:"#fffc00"}).animate({backgroundColor:"#ffffff"}, 1500);
				$child.find("button.icon").css({opacity:0.5});
				$field.remove();
				$submit.remove();
				$cancel.remove();
				$link.show();
			}
			$link.hide();
			$field.bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){ 
					processCreateChild();
				}
			});
			$linkParent
				.append($field)
				.append($submit)
				.append($cancel);
		},
		
		
		/**
		 * Returns string representation of private XML object
		 * @return	{String}
		 */
		getXmlAsString: function(){
			return (typeof XMLSerializer!=="undefined") ? 
				(new window.XMLSerializer()).serializeToString(_self.xml) : 
				_self.xml.xml;
		},
		
	
		/**
		 * Converts passed XML string into a DOM element.
		 * @param 		{String}			xmlStr
		 * @return		{Object}			XML DOM object
		 * @exception	{GeneralException}	Throws exception if no XML parser is available.
		 * @TODO Should use this instead of loading XML into DOM via $.ajax()
		 */
		getXmlDOMFromString: function(xmlStr){
			if (window.ActiveXObject && window.GetObject) {
				var dom = new ActiveXObject('Microsoft.XMLDOM');
				dom.loadXML(xmlStr);
				return dom;
			}
			if (window.DOMParser){
				return new DOMParser().parseFromString(xmlStr,'text/xml');
			}
			throw new Error( 'No XML parser available' );
		},
	
		
		/**
		 * Displays form for creating a new attribute and assigns handlers for storing that value
		 * @param	{Object} 	$addLink 	jQuery object
		 * @param 	{Objecct}	node
		 * @TODO Try using an HTML block (string) instead, and assign handlers using delegate()
		 */
		createAttribute: function($addLink, node){
			var $parent = $addLink.parent(),
				$form   = $("<form></form>"),
				$name   = $("<input type='text' class='newAttrName'  name='attrName'  value=''/>"),
				$value  = $("<input type='text' class='newAttrValue' name='attrValue' value=''/>"),
				$submit = $("<button>Create Attribute</button>"),
				$cancel = $("<button class='cancel'>Cancel</button>");		
			/**
			 * Private function for processing the values.
			 */
			function processNewAttribute(){
				var aName  = $name.val(),
					aValue = $value.val();
				try { 
					$(node).attr(aName, aValue);
				}
				catch (e){
					GLR.messenger.inform({msg:_message["invalidAttrName"],mode:"error"});
					$name.val("").focus();
					return false;
				}
				$form.remove();
				$("<span class='singleAttr'>"+aName+"=\"<span class='attrValue' name='"+aName+"'>" + 
					((aValue==="")?"&nbsp;":aValue) +"</span>\"</span>").insertBefore($addLink);
				$parent
					.find("span.attrValue:last")
						.click( function(e){ 
							e.stopPropagation();
							_self.editAttribute($(this), node, aName, aValue);
						});
				$addLink.show();
			} // end of processNewAttribute()
			$form.submit(function(){ return false; })
				.append($name)
				.append("<span class='equals'>=</span>")
				.append($value)
				.append($submit)
				.append($cancel);
			$addLink.hide();		
			$parent.append($form);
			$form.find("input").click(function(e){ 
				e.stopPropagation();
			});
			$form.find("input.newAttrName").bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){
					return false;
				}
			});
			$form.find("input.newAttrValue").bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){ 
					processNewAttribute();
				}
			});
			$name.focus();
			$submit.click(function(e){ 
				e.stopPropagation();
				e.preventDefault();
				processNewAttribute();
			});
			$cancel.click(function(e){
				e.stopPropagation(); 
				$form.remove();
				$addLink.show();
			});
		},
		
		
		/**
		 * Displays form for editing selected attribute and handles storing of that value.
		 * @param {Object}	$valueWrap
		 * @param {Object}	node
		 * @param {String}	name
		 * @param {String}	value
		 */
		editAttribute: function($valueWrap, node, name, value){
			var fieldWidth = parseInt($valueWrap.width()) + 30,
				$field     = $("<input type='text' name='' value='"+value+"' style='width:"+fieldWidth+"px;'/>"),
				$killAttr  = $("<button class='killAttr icon'/>").click(function(e){
					e.stopPropagation();																																					 
					if (confirm(_message["removeAttrConfirm"])){
						$(node).removeAttr(name);
						$(this).parent().remove();
					}
				});
			/**
			 * 
			 */
			function updateAttribute(){
				value = $field.val();
				$(node).attr(name, value); // update value in XML
				$field.remove();
				$killAttr.remove();
				if (value === "") value = "&nbsp;"
				$valueWrap.html(value).show();
			}
			$valueWrap.hide().after($field);
			$valueWrap.parent().append($killAttr);
			$field.get(0).focus(); 
			$field
				.bind("keydown", function(e){ 
					if (e.keyCode==13 || e.keyCode==27){
						updateAttribute();
					} 
				})
				.click(function(e){ 
					e.stopPropagation();
				});
		},
	
	
		/**
		 * Displays form for editing text value of passed node, then processes new value
		 * @param {Object}	$valueWrap
		 * @param {Object}	node
		 * @param {String}	name
		 * @TODO Wrap in form.editValue
		 * @TODO use delegate()
		 */
		editValue: function($valueWrap, node, value){
			var $field       = $("<textarea>"+value+"</textarea>"),
				$btnCancel   = $("<button class='cancel' style='float:left;'>Cancel</button>"),
				$btnSubmit   = $("<button class='submit' style='float:right;'>Set Text Value</button>"),
				$btnWrap     = $("<div class='editTextValueButtons'></div>").append($btnCancel).append($btnSubmit);
			$valueWrap.hide().parent().append($field).append($btnWrap);
			$field.get(0).focus();
			$btnSubmit.click(function(){
				value = $field.val();
				_self.setNodeValue(node, value); // update XML node value
				$valueWrap.text(value).show().parent().find("textarea, div.editTextValueButtons").remove();
			});
			$btnCancel.click(function(){
				$valueWrap.show().parent().find("textarea, div.editTextValueButtons").remove();
			});
		},
		
		
		/**
		 * Removes node from XML (and from displayed HTML representation).
		 * @param	{Object}	$link
		 * @param 	{String}	name
		 * @return	{Boolean}
		 */
		removeNode: function($link, node){
			if (confirm(_message["removeNodeConfirm"])){
				$(node).remove();
				var $prev = $link.parent().prev();
				if ($prev.length){
					$prev.addClass("last");
					$prev.find(">div.hitarea").addClass("last");
				}
				$link.parent().remove();
				GLR.messenger.inform({msg:_message["removeNodeSucess"], mode:"success"});
				return true;
			}
			return false;
		},
			
		
		/**
		 * Loads file path from the first argument via Ajax and makes it available as XML DOM object.
		 * Sets the $container which will hold the HTML tree representation of the XML.
		 * @param {String}		xmlPath          	Path to XML file
		 * @param {String}		containerSelector	CSS query selector for creating jQuery reference to container
		 * @param {Function}	callback
		 */
		loadXmlFromFile: function(xmlPath, containerSelector, callback){
			_self.$container = $(containerSelector);
			$.ajax({
				type     : "GET",
				async    : false,
				url      : xmlPath,
				dataType : "xml",
				error    : function(){ GLR.messenger.show({msg:_message["xmlLoadProblem"], mode:"error"}); },
				success  : function(xml){
					GLR.messenger.show({msg:_message["xmlLoadSuccess"], mode:"success"});
					_self.xml = xml;
					callback();
				}
			});
		},

		/**
		 * Creates a DOM representation of passed xmlString and stores it in the .xml property
		 * @param {String}		xmlPath          	Path to XML file
		 * @param {String}		containerSelector	CSS query selector for creating jQuery reference to container
		 * @param {Function}	callback
		 */
		loadXmlFromString: function(xmlString, containerSelector, callback){
			_self.$container = $(containerSelector);
			_self.xml        = _self.getXmlDOMFromString(xmlString);
			callback();
		},
		
			
		/**
		 * Calls methods for generating HTML representation of XML, then makes it collapsible/expandable
		 */
		renderTree: function(){
			GLR.messenger.show({msg:_message["renderingHtml"], mode:"loading"});
			_self.renderAsHTML();
			_self.$container.find("ul:first").addClass("treeview");
			GLR.messenger.inform({msg:_message["readyToEdit"], mode:"success"});
		}		
		
	};
	
	if (true){ // enable for measuring performance
		_bind("beforeHtmlRendered", function(){ console.time("renderHtml"); });
		_bind("afterHtmlRendered",  function(){ console.timeEnd("renderHtml"); });
	}
				
	return loggable(_self, "xmlEditor");
	
})();

