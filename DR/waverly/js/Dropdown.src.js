/*

Dropdown.js

Creates touch-friendly drop-down menus

Created by Kate Morley - http://code.iamkate.com/ - and released under the terms
of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

// create the Dropdown object
var Dropdown = (function(){

  // the delay, in milliseconds
  var DELAY = 250;

  // the list of menus
  var menus = [];

  // Initialises the drop-down menus.
  function initialise(){

    // listen for touch events on the document if appropriate
    if ('createTouch' in document){
      document.body.addEventListener('touchstart', handleTouchStart, false);
    }

    // loop over the menus, converting them
    var menus = document.querySelectorAll('ul.dropdown');
    for (var i = 0; i < menus.length; i ++) applyTo(menus[i]);

  }

  /* Handles a touch start event. The parameter is:
   *
   * e - the event
   */
  function handleTouchStart(e){

    // determine whether any menu is open
    var isOpen = false;
    for (var i = 0; i < menus.length; i ++){
      if (menus[i].isOpen) isOpen = true;
    }

    // return immediately if all menus are closed
    if (!isOpen) return;

    // move up the document tree until we reach the root node
    var node = e.target;
    while (node != null){

      // return immediately if we are inside a drop-down menu
      if (/\bdropdown\b/.test(node.className)) return;

      // move onto the parent node
      node = node.parentNode;

    }

    // close all menus
    close();

  }

  /* Closes all menus except the specified menu. The parameter is:
   *
   * menu - a menu not to close; this parameter is optional
   */
  function close(menu){

    // loop over the menus, closing them
    for (var i = 0; i < menus.length; i ++){
      if (menus[i] != menu) menus[i].close();
    }

  }

  /* Creates a drop-down menu. The parameter is:
   *
   * node - either the DOM node of the menu or the ID of the node
   */
  function applyTo(node){

    // fetch the DOM node if a string was supplied
    if (typeof node == 'string') node = document.getElementById(node);

    // create and store the new menu
    menus.push(new Menu(node));

  }

  /* Creates a drop-down menu. The parameter is:
   *
   * node - the DOM node of the menu
   */
  function Menu(node){

    // store the node
    this.node = node;

    // update the class name
    node.className += ' dropdownJavaScript';

    // listen for mouse events
    if ('addEventListener' in node){
      node.addEventListener(
          'mouseover', this.bind(this.handleMouseOver), false);
      node.addEventListener('mouseout', this.bind(this.handleMouseOut), false);
      node.addEventListener('click',    this.bind(this.handleClick),    false);
    }else{
      node.attachEvent('onmouseover', this.bind(this.handleMouseOver));
      node.attachEvent('onmouseout',  this.bind(this.handleMouseOut));
      node.attachEvent('onclick',     this.bind(this.handleClick));
    }

    // listen for touch events if appropriate
    if ('createTouch' in document){
      node.addEventListener('touchstart', this.bind(this.handleClick), false);
    }

  }

  // whether the menu is open
  Menu.prototype.isOpen = false;

  // the timeout
  Menu.prototype.timeout = null;

  /* Binds the specified function to the current object. The parameter is:
   *
   * f - the function
   */
  Menu.prototype.bind = function(f){

    // return the bound function
    var thisObject = this;
    return function(){ f.apply(thisObject, arguments); }

  }

  /* Handles a mouse over event. The parameters are:
   *
   * e         - the event
   * immediate - true to open the menu without a delay
   */
  Menu.prototype.handleMouseOver = function(e, immediate){

    // clear the timeout
    this.clearTimeout();

    // find the parent list item
    var item = ('target' in e ? e.target : e.srcElement);
    while (item.nodeName != 'LI' && item != this.node) item = item.parentNode;

    // if the target is within a list item, set the timeout
    if (item.nodeName == 'LI'){
      this.toOpen  = item;
      this.timeout =
          window.setTimeout(this.bind(this.open), (immediate ? 0 : DELAY));
    }

  }

  // Handles a mouse out event.
  Menu.prototype.handleMouseOut = function(){

    // clear the timeout
    this.clearTimeout();

    // set the timeout
    this.timeout = window.setTimeout(this.bind(this.close), DELAY);

  }

  /* Handles a click event. The parameter is:
   *
   * e - the event
   */
  Menu.prototype.handleClick = function(e){

    // close any other menus
    close(this);

    // find the parent list item
    var item = ('target' in e ? e.target : e.srcElement);
    while (item.nodeName != 'LI' && item != this.node) item = item.parentNode;

    // check that the target is within a list item
    if (item.nodeName == 'LI'){

      // check whether the item has a closed submenu
      var submenu = this.getChildrenByTagName(item, 'UL');
      if (submenu.length > 0 && !/\bdropdownOpen\b/.test(item.className)){

        // open the submenu
        this.handleMouseOver(e, true);

        // prevent the default action
        if ('preventDefault' in e){
          e.preventDefault();
        }else{
          e.returnValue = false;
        }

      }

    }

  }

  // Clears the timeout.
  Menu.prototype.clearTimeout = function(){

    // clear the timeout
    if (this.timeout){
      window.clearTimeout(this.timeout);
      this.timeout = null;
    }

  }

  // Opens the last item hovered over.
  Menu.prototype.open = function(){

    // store that the menu is open
    this.isOpen = true;

    // loop over the list items with the same parent
    var items = this.getChildrenByTagName(this.toOpen.parentNode, 'LI');
    for (var i = 0; i < items.length; i ++){

      // check whether there is a submenu
      var submenu = this.getChildrenByTagName(items[i], 'UL');
      if (submenu.length > 0){

        // check whether the submenu should be opened or closed
        if (items[i] != this.toOpen){

          // close the submenu
          items[i].className =
              items[i].className.replace(/\bdropdownOpen\b/g, '');
          this.close(items[i]);

        }else if (!/\bdropdownOpen\b/.test(items[i].className)){

          // open the submenu
          items[i].className += ' dropdownOpen';

          // determine the location of the edges of the submenu
          var left = 0;
          var node = submenu[0];
          while (node){
            left += node.offsetLeft;
            node = node.offsetParent;
          }
          right = left + submenu[0].offsetWidth;

          // move the submenu to the right of the item if appropriate
          if (left < 0) items[i].className += ' dropdownLeftToRight';

          // move the submenu to the left of the item if appropriate
          if (right > document.body.clientWidth){
            items[i].className += ' dropdownRightToLeft';
          }

        }

      }

    }

  }

  /* Closes the menus within the specified node. The parameter is:
   *
   * node - the node; if omitted, all menus are closed
   */
  Menu.prototype.close = function(node){

    // if no node was specified, close all menus
    if (!node){
      this.isOpen = false;
      node        = this.node;
    }

    // loop over the items, closing their submenus
    var items = node.getElementsByTagName('li');
    for (var i = 0; i < items.length; i ++){
      items[i].className = items[i].className.replace(/\bdropdownOpen\b/g, '');
    }

  }

  /* Returns an array containing the children of the specified node with the
   * specified tag name. The parameters are:
   *
   * node    - the node
   * tagName - the tag name
   */
  Menu.prototype.getChildrenByTagName = function(node, tagName){

    // initialise the list of children
    var result = [];

    // loop over the children, adding those with the right tag name to the list
    for (var i = 0; i < node.childNodes.length; i ++){
      if (node.childNodes[i].nodeName == tagName){
        result.push(node.childNodes[i]);
      }
    }

    // return the children
    return result;

  }

  // return the public API
  return {
    initialise : initialise,
    applyTo    : applyTo
  };

})();
