import $ from 'jquery';
import {keyOrderTab, heteroArrays, dontEncodeAsAttributes} from "./keyOrderTab.js";
import {DRObject, nameToClassTab} from "./Classes.jsx";
var xmlescape = require('xml-escape');
/*******************************************************************************

		JSON and XML conversions and aids.

********************************************************************************
*/

// Table of classes to create for given JSON object property names



var doNotSerialize = new Set();
var doNotSerializeJson = new Set();

doNotSerialize.add('uniqueId');
doNotSerializeJson.add('uniqueId');
doNotSerialize.add('_class');

function isArrayLike(val) {
    if (val === null) { return false;}
    if (Array.isArray(val)) return true;
//    if (isObservableArray(val)) return true;
    return false;
}

function isObject(val) {
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
}


/**
* Converts passed XML string into a DOM element.
* @param 		{String}			xmlStr
* @return		{Object}			XML DOM object
* @exception	{GeneralException}	Throws exception if no XML parser is available.
* @TODO Should use this instead of loading XML into DOM via $.ajax()
 */
function getXmlDOMFromString(xmlStr) {
	if (window.ActiveXObject && window.GetObject) {
		let dom = new ActiveXObject('Microsoft.XMLDOM');
		dom.loadXML(xmlStr);
		return dom;
	}
	if (window.DOMParser){
		return new DOMParser().parseFromString(xmlStr,'text/xml');
	}
	throw new Error( 'No XML parser available' );
}


// Changes XML Dom elements to JSON
// Modified to ignore text elements
// Modified version from here: http://davidwalsh.name/convert-xml-json
function xmlToJson(xml, fill) {
  // Create the return object
  let obj = fill ? fill : {};

  if (xml.nodeType === 1) { // element
	// do attributes
	if (xml.attributes.length > 0) {
	  obj['@attributes'] = {};
	  for (let j = 0; j < xml.attributes.length; j += 1) {
		const attribute = xml.attributes.item(j);
		obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
	  }
	}
  } else if (xml.nodeType === 3) { // text
	obj = xml.nodeValue;
  }

	let makeArray = heteroArrays.has(xml.nodeName);
	if (makeArray) {
		obj = [];
	}
  // do children
  // If just one text node inside
  if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
	obj = xml.childNodes[0].nodeValue;
  } else if (xml.hasChildNodes()) {
	for (let i = 0; i < xml.childNodes.length; i += 1) {
		const item = xml.childNodes.item(i);
		const nodeName = item.nodeName;
		if (item.nodeType === 3) continue; // JFF don't bother with text nodes
		let classToMake = nameToClassTab[nodeName];
		let childToFill;
		if (classToMake) {
			childToFill = new classToMake();
		}
	if (makeArray) {
		obj.push(xmlToJson(item, childToFill));
	} else if (typeof (obj[nodeName]) === 'undefined') {
		obj[nodeName] = xmlToJson(item, childToFill);
	  } else {
		if (typeof (obj[nodeName].push) === 'undefined') {
			const old = obj[nodeName];
			obj[nodeName] = [];
			obj[nodeName].push(old);
		}
		obj[nodeName].push(xmlToJson(item, childToFill)); // ,childToFill
	   }
	}
  }
  return obj;
}


function gentabs(d) {
	var str = "";
	for(let i = 0; i< d; ++i) str += '\t';
	return str;
}

function reviveClass(k, v) {
	if (doNotSerializeJson.has(k)) return undefined;
	if (!isObject(v)) return v;
	let kName = v._class;
	if (!kName) return v;
	let classToMake = nameToClassTab[kName];
	if (!classToMake) {
		console.log("class name not in class tab: " + kName);
		return v;
	}
	delete v._class;
	return new classToMake(v);
}

function jsonToXML(kv, j, d) {
//	console.log(kv);
	if(!isObject(j)) {
		return gentabs(d) + "<" + kv + ">" + j + "</" + kv + ">\n";
	}
	let atList = j["@attributes"];
	let atStr = "";
	if (atList) {
		for (let ak in atList) {
			if(atList.hasOwnProperty(ak)) {
				atStr += ' ';
				atStr += ak;
				atStr += '="';
				atStr += atList[ak];
				atStr +='"';
			}
		}
	}
	let insides = "";

	let keyOrder = [];
	let keyTab = keyOrderTab[kv];

	if (keyTab) {
		let keySet = new Set();
		for(let ek in j) { 
			if(!doNotSerialize.has(ek) && j.hasOwnProperty(ek) && ek != "@attributes") {
				keySet.add(ek);
			}
		}
		for (let ktx = 0; ktx < keyTab.length; ++ktx) {
			let nkv = keyTab[ktx];
			if (!doNotSerialize.has(nkv) && j.hasOwnProperty(nkv)) {
				keyOrder.push(nkv);
				keySet.delete(nkv);
			}
		}

		if (keySet.size > 0) {
			for (let sk of keySet.keys()) {
				keyOrder.push(sk);
				console.log("Missing: " + sk + " in: " + kv);
			}
		}
	} else { // No keytab entry, do it the old-fashioned way.
		for(let ek in j) { 
			if(!doNotSerialize.has(ek) && j.hasOwnProperty(ek) && ek != "@attributes") {
				keyOrder.push(ek);
			}
		}
	}

	for(let i = 0; i < keyOrder.length; ++i) {
		let kvo = keyOrder[i];
		let v = j[kvo];
		if (v === undefined) {
			continue;
		}

		if (kvo === 'instruments') {
			console.log('meow');
		}

		// a heteroArray is a special case. Instead of <tracks><track></track>…</tracks> we have
		// <instruments><sound></sound><kit></kit></instruments>. Put another way, a heteroArray
		// has more than one type of element in it.
		if (heteroArrays.has(kvo)) {
			insides += gentabs(d) + "<" + kvo + ">\n";
			for(let n = 0; n < v.length; ++n) {
				let ao = v[n];
				if (!(ao instanceof DRObject)) {
					continue;
				}
				let hkv = ao.xmlName();
				insides += jsonToXML(hkv, ao, d + 1);
			}
			insides +=  gentabs(d + 1) + "</" + kvo + ">\n";
		} else if (isArrayLike(v)) {
			for(let k = 0; k < v.length; ++k) {
				insides += jsonToXML(kvo, v[k], d + 1);
			}
		} else if (v.constructor == Object) {
			insides += jsonToXML(kvo, v, d + 1);
		} else {
				// Simple k/v pair
			if(typeof v === "string") v = v.trim();
			insides += jsonToXML(kvo, v, d);
		}
	}
	let str = gentabs(d) + "<" + kv + atStr;
	
	if (insides.length > 0) {
		str += '>\n' + insides + gentabs(d - 1) + '</' + kv + '>\n';
	} else {
		str += "/>";
	}
	return str;
}

function jsonToXMLString(root, json) {
	let depth = 0;
	return jsonToXML(root, json, depth);
}


// Thanks to Dr. White for the jsonequals function.
// https://stackoverflow.com/users/2215072/drwhite
// https://stackoverflow.com/questions/26049303/how-to-compare-two-json-have-the-same-properties-without-order
function jsonequals(x, y) {
	// If both x and y are null or undefined and exactly the same
	if ( x === y ) {
		return true;
	}

	// If they are not strictly equal, they both need to be Objects
	if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) {
		return false;
	}

	// They must have the exact same prototype chain, the closest we can do is
	// test the constructor.
	if ( x.constructor !== y.constructor ) {
		return false;
	}

	for (let p in x ) {
		// Inherited properties were tested using x.constructor === y.constructor
		if (!doNotSerialize.has(p) && x.hasOwnProperty( p ) ) {
			// Allows comparing x[ p ] and y[ p ] when set to undefined
			if ( ! y.hasOwnProperty( p ) ) {
				return false;
			}

			// If they have the same strict value or identity then they are equal
			if ( x[ p ] === y[ p ] ) {
				continue;
			}

			// Numbers, Strings, Functions, Booleans must be strictly equal
			if ( typeof( x[ p ] ) !== "object" ) {
				return false;
			}

			// Objects and Arrays must be tested recursively
			if ( !jsonequals( x[ p ],  y[ p ] ) ) {
				return false;
			}
		}
	}

	for (let p in y ) {
		// allows x[ p ] to be set to undefined
		if (!doNotSerialize.has(p) && y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) {
			return false;
		}
	}
	return true;
}

function sizeLimitScalar(v)
{
	if(v.constructor !== String) return v;
	if(v.length < 64) return v;
	return v.substr(0, 64) + '…';
}

function jsonToTable(json, obj, formatters) {
	for (let k in json) {
		if(json.hasOwnProperty(k)) {
			let tr = $('<tr/>');
			if(formatters && formatters[k]) {
				let ourTD = $("<td class='tabval' colspan='2'/>");
				formatters[k](json, k, ourTD);
				tr.append(ourTD);
				obj.append(tr);
				continue;
			}

			let v = json[k];
			if (v.constructor === Array) {
				let intTab = $('<table/>'); // subtable for array elements
				intTab.append($("<th class='arhead' colspan='3'/>").html(k + ':'));
				for(let ix = 0; ix < v.length; ++ix) {
					let tra = $('<tr/>');
					tra.append($("<td class='arindex'/>").html(ix)); // show array index
					let aobj = v[ix];
					if (aobj.constructor == Array || aobj.constructor == Object) {
						let deepTab = $('<table/>'); 
						let deeper = jsonToTable(aobj, deepTab, formatters);
						tra.append($("<td class='arsubtab'/>").html(deeper));
					} else {
						tra.append($("<td class='arscal'/>").html(sizeLimitScalar(aobj)));
					}
					intTab.append(tra);
				}
				tr.append(intTab);
			} else if(v.constructor === Object) {
				tr.append($("<td class='keyval'/>").html(k + ':'));
				let intTab = $('<table/>');
				let inside = jsonToTable(v, intTab, formatters);
				tr.append($("<td class='tabval' colspan='2'/>").html(inside));
				
			} else {
				tr.append($("<td class='keyval'/>").html(k + ':'));
				tr.append($("<td class='tabval'/>").html(sizeLimitScalar(v)));
				//tr.append($('<td/>'));
			}
			obj.append(tr);
		}	
	}
	return obj;
}

function forceArray(obj) {
	if(obj !== undefined && isArrayLike(obj)) return obj;
	let aObj = [];
	if(obj === undefined) return aObj;
	aObj[0] = obj;
	return aObj;
}

// 
function getClipArray(song) {
	if (song.tracks) {
		if (song.tracks.track) {
			return forceArray(song.tracks.track);
		}
	}

	if (song.sessionClips) {
		return forceArray(song.sessionClips);
	}

	return [];
}

function classReplacer(key, value) {
	if (value === undefined) {
		return value;
	}
	let meow = DRObject;
	if (!(value instanceof DRObject)) return value;
	let cname = value.xmlName();
	value._class = cname;
	return value;
}

function zonkDNS(json) {
 for (let k in json) {
 	if(json.hasOwnProperty(k)) {
 		if (doNotSerialize.has(k)) {
 			delete json[k];
 		} else {
 			let v = json[k];
 			if (isArrayLike(v)) {
 				for(let ix = 0; ix < v.length; ++ix) {
 					let aobj = v[ix];
 					if (isArrayLike(aobj) || isObject(aobj)) {
 						zonkDNS(aobj);
 					}
 				}
 			} else if (isObject(v)) {
 				zonkDNS(v);
 			}
 		} 
 	}
 }
}


// Changes XML Dom elements to JSON in new format.
function xml3ToJson(xml, fill) {
  // Create the return object
  let obj = fill ? fill : {};

  if (xml.nodeType === 1) { // element
	// do attributes
	if (xml.attributes.length > 0) {
	  for (let j = 0; j < xml.attributes.length; j += 1) {
		const attribute = xml.attributes.item(j);
		obj[attribute.nodeName] = attribute.nodeValue;
	  }
	}
  } else if (xml.nodeType === 3) { // text
	obj = xml.nodeValue;
  }

	let makeArray = heteroArrays.has(xml.nodeName);
	if (makeArray) {
		obj = [];
	}
  // do children
  // If just one text node inside
  if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
	obj = xml.childNodes[0].nodeValue;
  } else if (xml.hasChildNodes()) {
	for (let i = 0; i < xml.childNodes.length; i += 1) {
		const item = xml.childNodes.item(i);
		const nodeName = item.nodeName;
		if (item.nodeType === 3) continue; // JFF don't bother with text nodes
		let classToMake = nameToClassTab[nodeName];
		let childToFill;
		if (classToMake) {
			childToFill = new classToMake();
		}
	if (makeArray) {
		obj.push(xml3ToJson(item, childToFill));
	} else if (typeof (obj[nodeName]) === 'undefined') {
		obj[nodeName] = xml3ToJson(item, childToFill);
	  } else {
		if (typeof (obj[nodeName].push) === 'undefined') {
			const old = obj[nodeName];
			obj[nodeName] = [];
			obj[nodeName].push(old);
		}
		obj[nodeName].push(xml3ToJson(item, childToFill)); // ,childToFill
	   }
	}
  }
  return obj;
}

// Convert all the noteData values to noteDataWithLift values.
function updateJSONfor4(json)
{
 for (let k in json) {
 	if(json.hasOwnProperty(k)) {
 		 if (k === "noteData")
 		 {
 		 	let noteData = json[k];
 		 	let nv = "0x";
			for (var nx = 2; nx < noteData.length; nx += 20) {
					let nh = noteData.substring(nx, nx + 20);
					nv += 	nh.substring(0, 18);
					nv += "40";
					nv += nh.substring(18, 20);;
				}
 		 	json["noteDataWithLift"] = nv;
 		 	delete json["noteData"];
 		 	return;
 		 } else if (isObject(json[k])) {
 			updateJSONfor4(json[k]);
 		}
 	}
 }
}


function jsonToXML3(kv, j, d) {
//	console.log(kv);
	if(!isObject(j)) {
		return gentabs(d) + "<" + kv + ">" + j + "</" + kv + ">\n";
	}

	let insides = "";

	let attrList = [];
	let keySet = new Set();
	for(let ek in j) {
		if(!doNotSerialize.has(ek) && j.hasOwnProperty(ek)) {
			let v = j[ek];
			if (!isObject(v)) {
				if(!dontEncodeAsAttributes.has(ek)) attrList.push(ek);
			} else {
				keySet.add(ek);
			}
		}
	}

	let atStr = "";
	if (attrList) {
		for (let ix = 0; ix < attrList.length; ++ix) {
			let ak = attrList[ix];
			let v = String(j[ak]).trim();
			if (ix > 0) {
				atStr += "\n" + gentabs(d + 1);
			} else {
				atStr += ' ';
			}
			let ve = xmlescape(v);
			atStr += ak;
			atStr += '="';
			atStr += ve;
			atStr +='"';
		}
	}

	let keyTab = keyOrderTab[kv];
	let keyOrder = [];

	if (keyTab) {
		for (let ktx = 0; ktx < keyTab.length; ++ktx) {
			let nkv = keyTab[ktx];
			if (keySet.has(nkv)) {
				keyOrder.push(nkv);
				keySet.delete(nkv);
			}
		}

		if (keySet.size > 0) {
			for (let sk of keySet.keys()) {
				keyOrder.push(sk);
				console.log("Missing: " + sk + " in: " + kv);
			}
		}
	} else { // No keytab entry, do it the old-fashioned way.
		for(let ek in keySet) { 
			keyOrder.push(ek);
		}
	}

	for(let i = 0; i < keyOrder.length; ++i) {
		let kvo = keyOrder[i];
		let v = j[kvo];
		if (v === undefined) {
			continue;
		}

		if (kvo === 'instruments') {
			console.log('meow');
		}

		// a heteroArray is a special case. Instead of <tracks><track></track>…</tracks> we have
		// <instruments><sound></sound><kit></kit></instruments>. Put another way, a heteroArray
		// has more than one type of element in it.
		if (heteroArrays.has(kvo)) {
			insides += gentabs(d) + "<" + kvo + ">\n";
			for(let n = 0; n < v.length; ++n) {
				let ao = v[n];
				if (!(ao instanceof DRObject)) {
					continue;
				}
				let hkv = ao.xmlName();
				insides += jsonToXML3(hkv, ao, d + 1);
			}
			insides +=  gentabs(d + 1) + "</" + kvo + ">\n";
		} else if (isArrayLike(v)) {
			for(let k = 0; k < v.length; ++k) {
				insides += jsonToXML3(kvo, v[k], d + 1);
			}
		} else if (isObject(v)) {
			insides += jsonToXML3(kvo, v, d + 1);
		} else {
				// Simple k/v pair
			console.log("k/v pair should not appear here " + kvo + " " + v);
			// if(typeof v === "string") v = v.trim();
			// insides += jsonToXML3(kvo, v, d);
		}
	}
	let str = gentabs(d) + "<" + kv + atStr;
	
	if (insides.length > 0) {
		str += '>\n' + insides + gentabs(d) + '</' + kv + '>\n';
	} else {
		str += "/>\n";
	}
	return str;
}


function jsonToXML3String(root, json) {
	let depth = 0;
	return jsonToXML3(root, json, depth);
}
export {getXmlDOMFromString, jsonequals, jsonToXMLString, xmlToJson, xml3ToJson, updateJSONfor4, reviveClass, 
	jsonToXML3String, jsonToTable, forceArray, getClipArray, isArrayLike, nameToClassTab, classReplacer, zonkDNS};