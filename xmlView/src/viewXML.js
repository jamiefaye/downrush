
import $ from'./js/jquery-3.2.1.min.js';
import Clipboard from "./js/clipboard.min.js";
import tippy from "./js/tippy.all.min.js";
import {patchNames, kitNames} from "./js/delugepatches.js";
require('file-loader?name=[name].[ext]!../viewXML.htm');
require('file-loader?name=[name].[ext]!../css/edit.css');
import Handlebars from './js/handlebars.min.js';
import {keyOrderTab} from "./keyOrderTab.js";
import {openFileBrowser, saveFileBrowser} from './FileBrowser.js';
import {
local_exec_head,
local_exec_info,
note_tip_template,
track_head_template,
sample_list_template,
param_plot_template,
paster_template,
midiKnobTemplate,
modKnobTemplate,
midiModKnobTemplate,
sample_list_header,
sample_entry_template,
sample_name_prefix,
sound_template
} from "./templates.js";

"use strict";

// Change the following line as needed to point to the parent directory containing your sample directory.
// If you leave it undefined, our code will make an informed guess as to where your samples are located.
// You probably don't need to change it.
var custom_sample_path = undefined;

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;

var sample_path_prefix = '/';
var xPlotOffset = 32;
var jQuery = $;

// Variables to convert to instance variables for an object.
var fname = "";
var jsonDocument;
var firmwareVersionFound = '';
var newNoteFormat = false;


// End of variables to move into object.


/*******************************************************************************

		JSON and XML conversions and aids.

********************************************************************************
*/

/**
* Converts passed XML string into a DOM element.
* @param 		{String}			xmlStr
* @return		{Object}			XML DOM object
* @exception	{GeneralException}	Throws exception if no XML parser is available.
* @TODO Should use this instead of loading XML into DOM via $.ajax()
 */
function getXmlDOMFromString(xmlStr) {
	if (window.ActiveXObject && window.GetObject) {
		var dom = new ActiveXObject('Microsoft.XMLDOM');
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
	if (typeof (obj[nodeName]) === 'undefined') {
		obj[nodeName] = xmlToJson(item, childToFill);
	  } else {
		if (typeof (obj[nodeName].push) === 'undefined') {
			const old = obj[nodeName];
			obj[nodeName] = [];
			obj[nodeName].push(old);
		}
		obj[nodeName].push(xmlToJson(item, childToFill));
	   }
	}
  }
  return obj;
}

function gentabs(d) {
	var str = "";
	for(var i = 0; i< d; ++i) str += '\t';
	return str;
}

function jsonToXML(kv, j, d) {
	if(j.constructor !== Object && j.constructor !== Array) {
		return gentabs(d) + "<" + kv + ">" + j + "</" + kv + ">\n";
	}
	let atList = j["@attributes"];
	let atStr = "";
	if (atList) {
		for (var ak in atList) {
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
		for(var ek in j) { 
			if(j.hasOwnProperty(ek) && ek != "@attributes") {
				keySet.add(ek);
			}
		}
		for (var ktx = 0; ktx < keyTab.length; ++ktx) {
			let nkv = keyTab[ktx];
			if (j.hasOwnProperty(nkv)) {
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
		for(var ek in j) { 
			if(j.hasOwnProperty(ek) && ek != "@attributes") {
				keyOrder.push(ek);
			}
		}
	}

	for(var i = 0; i < keyOrder.length; ++i) {
		let kv = keyOrder[i];
		let v = j[kv];
		if (v === undefined) {
			continue;
		}
		if (v.constructor === Array) {
			for(var i = 0; i < v.length; ++i) {
				insides += jsonToXML(kv, v[i], d + 1);
				}
		} else if (v.constructor == Object) {
			insides += jsonToXML(kv, v, d + 1);
		} else {
				// Simple k/v pair
			if(typeof v === "string") v = v.trim();
			insides += jsonToXML(kv, v, d);
		}
	}
	let str = gentabs(d - 1) + "<" + kv + atStr;
	
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

	for ( var p in x ) {
		// Inherited properties were tested using x.constructor === y.constructor
		if ( x.hasOwnProperty( p ) ) {
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

	for ( p in y ) {
		// allows x[ p ] to be set to undefined
		if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) {
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
	for (var k in json) {
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
				for(var ix = 0; ix < v.length; ++ix) {
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


/*******************************************************************************

		Handlebars formatters

********************************************************************************
*/

function convertHexTo50(str)
{
	let v = parseInt(str, 16);
	if (v & 0x80000000) {
			v -= 0x100000000;
		}
	let vr = Math.round( ((v + 0x80000000) * 50) / 0x100000000);
	return vr;
}

function fixhex(v) {
	if(v === undefined) return v;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {

		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		ranged = Math.round( ((asInt + 0x80000000) * 50) / 0x100000000);
		if (v.length > 10) {
			ranged += '…';
		}
	}
	return ranged;
}

// scale 0x00000000 to 0x7FFFFFFF to 0-50
function fixpos50(v) {
	if(v === undefined) return undefined;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		ranged = Math.round( (asInt * 50) / 0x7FFFFFFF);
		if (v.length > 10) {
			ranged += '…';
		}
	}
	return ranged;
}


function fmtMidiCC(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;

	let res = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		// Midi CC params range from 0 to 127
		res = Math.round( (asInt + 0x80000000) * 127 / 0x100000000);
	}
	if (v.length > 10) {
		res += '…';
	}
	return res;
}


function fixpan(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		let rangedm32to32 = Math.round( ((asInt + 0x80000000) * 64) / 0x100000000) - 32;
		if (rangedm32to32 === 0) ranged = 0;
		else if (rangedm32to32 < 0) ranged = Math.abs(rangedm32to32) + 'L';
		 else ranged = rangedm32to32 + 'R';
	}
	if (v.length > 10) {
		ranged += '…';
	}
	return ranged;
}

Handlebars.registerHelper('fixh', fixhex);
Handlebars.registerHelper('fixpan',fixpan);
Handlebars.registerHelper('fixpos50',fixpos50);
Handlebars.registerHelper('fmtMidiCC',fmtMidiCC);
// Vibrato (and other mod source scaling).
function fixm50to50(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	let res = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		// mod matrix weights range from 0xC0000000 to 0x3FFFFFF, and we want to show it
		// as -50 to 50
		res = Math.round( ((asInt + 0x80000000) * 200) / 0x100000000) - 100;
	}
	if (v.length > 10) {
		res += '…';
	}
	return res;
}


Handlebars.registerHelper('fixrev', function (v) {
	if (v === undefined) return v;
	let vn = Number(v);
	let ranged = Math.round( (vn * 50) / 0x7FFFFFFF);
	return ranged;
});


Handlebars.registerHelper('fixphase', function (v) {
	if (v === undefined) return v;
	let vn = Number(v);
	if (vn == -1) return 'off';
	// convert to unsigned 32 bits and divide by scaling factor.
	return Math.round((Number(vn) >>> 0) / 11930464);
});


Handlebars.registerHelper('fmtmoddest', function (tv) {
	if (tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn === 0) return 'carrier';
	if (tvn === 1) return 'mod 1';
	return 'Unknown';

});

Handlebars.registerHelper('fmttime', function (tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
});


Handlebars.registerHelper('fmtonoff', function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn > 0) return 'on';
	return 'off';
});


Handlebars.registerHelper('fmttransp', function (osc) {
	if(osc === undefined) return "";
	let amt = Number(osc.transpose) + Number(osc.cents) / 100;
	return amt.toFixed(2);
});

var priorityTab = ["low", "medium", "high"];

Handlebars.registerHelper('fmtprior', function (p) {
	if(p === undefined) return "";
	p = Number(p);
	if(p < 0 || p >= priorityTab.length) return '';
	return priorityTab[p];
});


var syncLevelTab = ["off", "4 bars", "2 bars", "1 bar", "2nd", "4th", "8th", "16th", "32nd", "64th"];

Handlebars.registerHelper('fmtsync', function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	return syncLevelTab[tvn];
});


Handlebars.registerHelper('shrinkifneeded', function (s) {
	if(s === undefined) return "";
	if (s.length <= 6) {
		return s;
	}
	return"<div class='textsm2'>" + s + "</div>";
});

var sidechain_release = [261528,38632, 19552, 13184, 9872, 7840, 6472, 5480, 4736, 4152, 3680, 3296, 2976,
2704, 2472, 2264, 2088, 1928, 1792, 1664, 1552, 1448, 1352, 1272, 1192, 1120, 1056, 992, 936, 880, 832,
784, 744, 704, 664, 624, 592, 560, 528, 496, 472, 448, 424, 400, 376, 352, 328, 312, 288, 272, 256];

var sidechain_attack = [1048576, 887876, 751804, 636588, 539028, 456420, 386472, 327244, 277092,
234624, 198668, 168220, 142440, 120612, 102128, 86476, 73224, 62000, 52500, 44452, 37640, 31872,
26988, 22852, 19348, 16384, 13876, 11748, 9948, 8428, 7132, 6040, 5112, 4328, 3668, 3104, 2628,
2224, 1884, 1596, 1352, 1144, 968, 820, 696, 558, 496, 420, 356, 304, 256];

function binaryIndexOf(tab,	seek) {
	if (seek === undefined) return undefined;
 
	var	minX = 0;
	var	maxX= tab.length - 1;
	var	curX;
	var	curItem;
 
	while (minX	<= maxX) {
		curX = (minX + maxX) / 2 | 0;
		curItem	= tab[curX];
 
		if (curItem	> seek)	{
			minX = curX	+ 1;
		}
		else if	(curItem < seek) {
			maxX = curX	- 1;
		}
		else {
			return curX;
		}
	}
	return maxX;
}

Handlebars.registerHelper('fmtscrelease', function (sv) {
	return binaryIndexOf(sidechain_release, sv);
	
});

Handlebars.registerHelper('fmtscattack', function (sv) {
	return binaryIndexOf(sidechain_attack, sv);
	
});

/* Plotters
*/

var gamma = 1.0 / 5.0;
var gammaTab;

function gamma_correct(hexChars) {
	if(!gammaTab) {
		gammaTab = [];
		for(var i = 0; i < 256; ++i) {
			// gammaTab[i] = 255.0 * ((i / 255.0) ** (1. gamma));
			
			gammaTab[i] = Math.round( ((i / 255.0) ** gamma * 255.0 ) );
		}
	}
	let pix = parseInt(hexChars, 16);
	let r = pix >> 16;
	let g = pix >> 8 & 0xFF;
	let b = pix & 0xFF;
	let fixedPix = (gammaTab[r] << 16) + (gammaTab[g] << 8) + gammaTab[b];
	let asHex = (fixedPix + 0x1000000).toString(16).slice(-6); // Thanks Fabio Ferrari!
	return asHex;
}
function genColorTab(colors)
{
	let colTab = $("<table class='xmltab'/>");
	for(var y = 0; y < 8; ++y) {
		let colRow = $('<tr/>');
		for(var x = 0; x <18; ++x) {
			let td = $("<td class='coltab'/>");
			let off = (7 - y) * 108 + x * 6;
			let hex = colors.substr(off, 6);
			// if (hex !== '000000') console.log("(" + x + ", " + y + " = 0x" + hex);
			td.css("background-color", '#' + gamma_correct(hex));
			colRow.append(td);
		}
		colTab.append(colRow);
	}
	return colTab;
}

function forceArray(obj) {
	if(obj !== undefined && obj.constructor === Array) return obj;
	let aObj = [];
	if(obj === undefined) return aObj;
	aObj[0] = obj;
	return aObj;
}

// Used to cope with y addresses of -32768
function rowYfilter(row) {
	if (row.drumIndex) return Number(row.drumIndex);
	let y = Number(row.y);
	return y;
}

var noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert Midi note number into note name + octave, with 0 meaning C minus 2
function yToNoteName(note)
{
	let oct = Math.round(note / 12) - 2;
	let tone = note % 12;
	return noteNames[tone] + oct;
}

function encodeNoteInfo(noteName, time, dur, vel, cond)
{
	// Use hack to generate leading zeros.
	let th = (Number(time) + 0x100000000).toString(16).substring(1);
	let dh = (Number(dur) + 0x100000000).toString(16).substring(1);
	let vh = (Number(vel) + 0x100).toString(16).substring(1);
	let ch = (Number(cond) + 0x100).toString(16).substring(1);

	return th + dh + vh + ch + noteName;
}

function plotNoteName(note, style, parentDiv) {
	let labName = yToNoteName(note);
	if (labName != undefined) {
		let labdiv = $("<div class='notelab'/>");
		labdiv.text(labName);
		labdiv.css(style);
		parentDiv.append(labdiv);
	}
}


function rgbToHexColor(r, g, b)
{
	let rh = r.toString(16);
	if (rh.length < 2) rh = "0" + rh;
	let gh = g.toString(16);
	if (gh.length < 2) gh = "0" + gh;
	let bh = b.toString(16);
	if (bh.length < 2) bh = "0" + bh;
	return '#' + rh + gh + bh;
	
}
function colorEncodeNote(vel,cond) {
	if (cond === 0x14) {
		// vanilla note, just encode velocity	
		let cv = (128 - vel) + 0x30;
		return rgbToHexColor(cv, cv, cv);
	}
	if (cond < 0x14) {
		if (cond < 5) { // red
			return 'red';
		} else if(cond < 15) { // yellow
			return 'yellow';
		} else { // green
			return 'green';
			
		}
	}
	else if (cond > 0x14) { // blue for conditional
		return 'lightblue';
	}
}

// 192 is the typical denominator. It's prime factors are 2 and 3.
function simplifyFraction(num, den)
{
	while (num && den && (num & 1) === 0 && (den & 1) === 0) {
		num >>= 1; den >>= 1;
	}
	while (num && den && (num % 3) === 0 && (den % 3) === 0) {
		num /= 3; den /= 3;
	}
	if(num === den) return "1";

	if(den === 1) return num.toString();

	return num.toString() + '/' + den.toString();
}

/*
	Demarcation for code to roll-up into objects followimg.
	
*/

class DRObject {

};




/*******************************************************************************

		SOUND & MIDI
		
 *******************************************************************************
*/



class Sound extends DRObject {

};


function formatSound(obj)
{
	let context = {};
	for (var i = 1; i < arguments.length; ++i) {
		if(arguments[i]) {
			jQuery.extend(true, context, arguments[i]);
		}
	}

	if (context.midiKnobs && context.midiKnobs.midiKnob) {
		obj.append(midiKnobTemplate(forceArray(context.midiKnobs.midiKnob)));
		// formatModKnobs(context.modKnobs.modKnob, "Midi Parameter Knob Mapping", obj);
	}

	if (context.modKnobs && context.modKnobs.modKnob) {
		formatModKnobs(context.modKnobs.modKnob, "Parameter Knob Mapping", obj);
	}

	// Populate mod sources fields with specified destinations
	if (context.patchCables) {
		let destMap = {};
		let patchA = forceArray(context.patchCables.patchCable);
		for (var i = 0; i < patchA.length; ++i) {
			let cable = patchA[i];
			let sName = "m_" + cable.source;
			let aDest = cable.destination;
			// Vibrato is represented by a patchCable between lfo1 and pitch
			if (cable.source === 'lfo1' && aDest === 'pitch') {
				let vibratoVal = fixm50to50(cable.amount);
				context['vibrato'] = vibratoVal;
			}
			let amount = fixm50to50(cable.amount);
			let info = aDest + "(" + amount + ")";
			let val = destMap[sName];
			if (val) val += ' ';
				else val = "";
			val += info;
			destMap[sName]  = val;
		}
		
		jQuery.extend(true, context, destMap);
	}
	context.sample_path_prefix = sample_path_prefix;
	if ( (context.osc1 && context.osc1.fileName) || (context.osc2 && context.osc2.fileName) ) {
		let subContext = jQuery.extend(true, {}, context);
		// If Osc2 does not have a sample defined for it, strike osc2 from the context
		if (!context.osc2 || !context.osc2.fileName || $.isEmptyObject(context.osc2.fileName)) {
			delete subContext.osc2;
		}
		context.stprefix = sample_name_prefix(subContext);
	}
	obj.append(sound_template(context));
}

function formatMidi(obj)
{
	let context = {};
	for (var i = 1; i < arguments.length; ++i) {
		if(arguments[i]) {
			jQuery.extend(true, context, arguments[i]);
		}
	}
	if (context.modKnobs && context.modKnobs.modKnob) {
		formatModKnobsMidi(context.modKnobs.modKnob, obj);
	}
}

function viewSound(e) {
	let target = e.target;
	let trn =  Number(target.getAttribute('trackno'));

	let hideShow = target.textContent;
	let songJ = jsonDocument.song;
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	let trackIX = trackA.length - trn - 1;
	let trackD = trackA[trackIX];
	
	// Follow any indirect reference
	if (trackD.instrument && trackD.instrument.referToTrackId !== undefined) {
		let fromID = Number(trackD.instrument.referToTrackId);
		trackD = trackA[fromID];
	}

	let divID = '#snd_place' + trn;
	let where = $(divID);

	if (hideShow === "▼") {
		target.textContent = "►";
		$(where)[0].innerHTML = "";
	} else {
		let trackType = trackKind(trackD);
		if (trackType === 'sound' || trackType === 'kit'|| trackType === 'midi') {
			target.textContent = "▼";
		} else {
			return;
		}
		if (trackType === 'sound') {
		formatSound(where, trackD.sound, trackD.soundParams);
	  } else if (trackType === 'kit') {
			// We have a kit track,, 
			let kitroot = trackD.kit;
			if (trackD['soundSources']) {
				kitroot = trackD;
			}
			formatKit(kitroot, where, trackD.kitParams, trackD);
		} else if(trackType === 'midi') {
			formatMidi(where, trackD);
		}
	 }
}

/*******************************************************************************

		KIT

 *******************************************************************************
*/



class Kit extends DRObject {

};

function plotKit13(track, reftrack, obj) {
	let kitItemH = 8;
	let trackW = Number(track.trackLength);
// first walk the track and find min and max y positions
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='kitgrid'/>");
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let totH = ((ymax - ymin) + 1) * kitItemH;
	let kitList = forceArray(reftrack.kit.soundSources.sound);
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		let ypos = (y- ymin) * kitItemH;
		let labName = '';
		if (row.drumIndex) {
			let rowInfo = kitList[row.drumIndex];
			labName = rowInfo.name;
			if (labName != undefined) {
				let labdiv = $("<div class='kitlab'/>");
				labdiv.text(labName);
				labdiv.css({left: 0, bottom: (ypos - 2) + 'px'});
				parentDiv.append(labdiv);
			}
		}
		if (y < 0) continue;
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = Number(n.pos);
			let dx = x + xPlotOffset;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;

			let noteInfo = encodeNoteInfo(labName, x, n.length, vel, 0x14);
			let ndiv = $("<div class='trkitnote npop' data-note='" + noteInfo + "'/>");

			ndiv.css({left: dx + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	obj.append(parentDiv);
}



function plotKit14(track, reftrack, obj) {
	let kitItemH = 8;
	let trackW = Number(track.trackLength);
// first walk the track and find min and max y positions
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='kitgrid'/>");
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let totH = ((ymax - ymin) + 1) * kitItemH;
	let kitList = forceArray(reftrack.kit.soundSources.sound);
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteData = row.noteData;
		let labName = '';
		let y = rowYfilter(row);
		let ypos = (y- ymin) * kitItemH;

		if (row.drumIndex) {
			let rowInfo = kitList[row.drumIndex];
			labName = rowInfo.name;
			if (labName != undefined) {
				let labdiv = $("<div class='kitlab'/>");
				labdiv.text(labName);
				labdiv.css({left: 0, bottom: (ypos - 2) + 'px'});
				parentDiv.append(labdiv);
			}
		}
		if (y < 0) continue;
		
		for (var nx = 2; nx < noteData.length; nx += 20) {
			let notehex = noteData.substring(nx, nx + 20);
			let x = parseInt(notehex.substring(0, 8), 16);
			let dur =  parseInt(notehex.substring(8, 16), 16);
			let vel = parseInt(notehex.substring(16, 18), 16);
			let cond = parseInt(notehex.substring(18, 20), 16);
			let noteInfo = notehex + labName;
			x += xPlotOffset;
			if (dur > 1) dur--;
			let ndiv = $("<div class='trnkn npop' data-note='" + noteInfo + "'/>");
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px', "background-color": colorEncodeNote(vel, cond)});
			parentDiv.append(ndiv);
		}
	}
	obj.append(parentDiv);
}



function plotKit(track, reftrack, obj) {
	if(newNoteFormat) {
		plotKit14(track, reftrack, obj);
	} else {
		plotKit13(track, reftrack, obj);
	}
}


function openKitSound(e, kitTab, kitParams, track) {
	let target = e.target;
	let ourX = Number(target.getAttribute('kitItem'));

	var aKitSound;
	if (ourX >= 0) {
		aKitSound = kitTab[ourX];
	} else {
		aKitSound = kitParams;
		if(!aKitSound) return;
	}

	let ourRow = target.parentNode;
	let nextRow = ourRow.nextElementSibling;
	let ourTab = ourRow.parentNode;
	if (nextRow && nextRow.classList.contains('soundentry')) {
		ourTab.removeChild(nextRow);
		target.textContent = "►";
		return;
	}
	var noteSound = {};
	if(track && track.noteRows && ourX >= 0) {
		let noteRowA= forceArray(track.noteRows.noteRow);
		for (var i = 0; i < noteRowA.length; ++i) {
			let aRow = noteRowA[i];
			if(Number(aRow.drumIndex) === ourX) {
				 noteSound = aRow.soundParams;
				 break;
			}
		}
	}

	let newRow = $("<tr class='soundentry'/>");
	let newData =$("<td  colspan='8'/>");

	formatSound(newData, aKitSound, aKitSound.defaultParams, aKitSound.soundParams, noteSound);

	newRow.append(newData);
	if (nextRow) {
		ourTab.insertBefore(newRow[0], nextRow);
	} else {
		ourTab.appendChild(newRow[0]);
	}
	target.textContent = "▼";
}

function formatKit(json, obj, kitParams, track) {
	
	let kitList = forceArray(json.soundSources.sound);
	
	let tab = $("<table class='kit_tab'/>");
	let hasKitParams = kitParams !== undefined;
	tab.append(sample_list_header({hasKitParams: hasKitParams}));
	
	for(var i = 0; i < kitList.length; ++i) {
		let kit = kitList[i];
		formatSampleEntry(kit, tab, i);
	}
	
	
	obj.append(tab);

	let opener = function (e) {
		let js = json;
		openKitSound(e, kitList, kitParams, track);
	};
	$('.kit_opener').on('click', opener);
}



/*******************************************************************************

		TRACK

 *******************************************************************************
*/

class Track extends DRObject {

};


function plotTrack13(track, obj) {
// first walk the track and find min and max y positions
	let trackW = Number(track.trackLength);
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='trgrid'/>");
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let totH = ((ymax - ymin) + 2) * 4;

	parentDiv.css({height: totH + 'px'});
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});

	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		let labName = yToNoteName(y);
		if (y < 0) continue;
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = Number(n.pos);
			let dx = x + xPlotOffset;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;

			let noteInfo = encodeNoteInfo(labName, x, n.length, vel, 0x14);
			let ndiv = $("<div class='trnote npop' data-note='" + noteInfo + "'/>");
			let ypos = (y- ymin) * 4 + 2;
			ndiv.css({left: dx + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	let miny = totH - 10;
	plotNoteName(ymin, {top: miny + 'px', obj}, parentDiv);
	if (ymin !== ymax) {
		plotNoteName(ymax, {top: '0px'}, parentDiv);
	}
	obj.append(parentDiv);
}


function plotTrack14(track, obj) {
// first walk the track and find min and max y positions
	let trackW = Number(track.trackLength);
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='trgrid'/>");
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let totH = ((ymax - ymin) + 2) * 4;

	parentDiv.css({height: totH + 'px'});
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});

	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteData = row.noteData;
		let y = rowYfilter(row);
		if (y < 0) continue;
		let labName = yToNoteName(y);
		for (var nx = 2; nx < noteData.length; nx += 20) {
			let notehex = noteData.substring(nx, nx + 20);
			let x = parseInt(notehex.substring(0, 8), 16);
			let dur =  parseInt(notehex.substring(8, 16), 16);
			let vel = parseInt(notehex.substring(16, 18), 16);
			let cond = parseInt(notehex.substring(18, 20), 16);
			let noteInfo = notehex + labName;
			x += xPlotOffset;
			if (dur > 1) dur--;
			let ndiv = $("<div class='trnsn npop' data-note='" + noteInfo + "'/>");

			let ypos = (y- ymin) * 4 + 2;
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px', "background-color": colorEncodeNote(vel, cond)});
			parentDiv.append(ndiv);
		}
	}
	let miny = totH - 10;
	plotNoteName(ymin, {top: miny + 'px', obj}, parentDiv);
	if (ymin !== ymax) {
		plotNoteName(ymax, {top: '0px'}, parentDiv);
	}
	obj.append(parentDiv);

}


var nitTable = "111222132333142434441525354555162636465666172737475767771828384858687888";


function activateNoteTips()
{
	tippy('.npop', {
		arrow: true,
		html: '#npoptemp',
		onShow(pop) {
		// `this` inside callbacks refers to the popper element
			const content = this.querySelector('.tippy-content');
			let notehex = pop.reference.getAttribute('data-note');

			let x = parseInt(notehex.substring(0, 8), 16);
			let dur =  parseInt(notehex.substring(8, 16), 16);
			let vel = parseInt(notehex.substring(16, 18), 16);
			let cond = parseInt(notehex.substring(18, 20), 16);
			let notename = notehex.substring(20);
			let condtext = '';
			let condcode = cond & 0x7F;
			if (condcode != 0x14) {
				if (condcode < 0x14) { // Its a probability.
					let prob = condcode * 5;
					condtext = prob + '%';
					if(cond & 0x80) { // if it has a dot, show that
						condtext = '.' + condtext;
					}
				} else { // Its a 1 of N
					let nitBase = (condcode - 0x14) * 2;
					condtext = '[' + nitTable[nitBase] + " out of " + nitTable[nitBase + 1] + ']';
				}
			}

			// Convert duration to fraction of a measure
			let durFrac = simplifyFraction(dur, 192);

			// Convert start time to measure, beat, subbeat
			let meas = Math.floor(x / 192) + 1;
			let beat = Math.floor((x % 192) / 48)+ 1;
			let subbeat = Math.floor((x % 48) / 12) + 1;
			let subFrac = Math.floor(x % 12);
			let beatX = meas.toString() + '.' + beat.toString() + '.' + subbeat.toString();
			if (subFrac > 0) {
				beatX += '+' + simplifyFraction(subFrac, 192);
			}
			// {{notename}} {{notevel}} {{notedur}} {{notestart}} {{noteprob}}
			let noteInfo = note_tip_template({
				notename: notename,
				notevel: vel,
				notedur: durFrac,
				notestart: beatX,
				noteprob: condtext,
			});
			content.innerHTML = noteInfo;
			},
		onHidden() {
			const content = this.querySelector('.tippy-content')
			content.innerHTML = '';
			},
	});
}

// Convert an old (pre 1.4) noteRow from the note array representation into the noteData representation.
function oldToNewNotes(track)
{
	let rowList = forceArray(track.noteRows.noteRow);
	track.noteRows.noteRow = rowList;
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx]; // make sure JSON is updated.
		var noteList = forceArray(row.notes.note);
		let noteData = '0x';
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = Number(n.pos);
			let dur = Number(n.length);
			let vel = Number(n.velocity);

			let noteInfo = encodeNoteInfo('', x, dur, vel, 0x14);
			noteData += noteInfo;
		}
		row.noteData = noteData;
		delete row.notes;
	}
}


function newToOldNotes(track) {
	let rowList = forceArray(track.noteRows.noteRow);
	track.noteRows.noteRow = rowList;

	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteData = row.noteData;
		let noteArray = [];

		for (var nx = 2; nx < noteData.length; nx += 20) {
			let notehex = noteData.substring(nx, nx + 20);
			let t = parseInt(notehex.substring(0, 8), 16);
			let dur =  parseInt(notehex.substring(8, 16), 16);
			let vel = parseInt(notehex.substring(16, 18), 16);
			// let cond = parseInt(notehex.substring(18, 20), 16);
			let note = {
				pos:		t,
				length: 	dur,
				velocity: 	vel,
			};
			noteArray.push(note);
		}
		delete row.noteData;
		row.notes = {};
		row.notes.note = noteArray;
	}
}

function usesNewNotekFormat(track) {
	let rowList = forceArray(track.noteRows.noteRow);
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		if (row.noteData) return true;
		if (row.notes && row.notes.note) return false;
	}
	return false;
}

function plotTrack(track, obj) {
	if(newNoteFormat) {
		plotTrack14(track, obj);
	} else {
		plotTrack13(track, obj);
	}
}

function plotParamChanges(k, ps, tracklen, prefix, elem)
{
	elem.append($("<p class='tinygap'/>"));
	let parentDiv = $("<div class='parmplot'/>");
	let cursor = 10;
	let xpos = 0;
	let textH = 8;

	var runVal = convertHexTo50(ps.substring(2,10));

	while (cursor < ps.length) {
		let nextVal = convertHexTo50(ps.substring(cursor, cursor + 8));
		let runx = parseInt(ps.substring(cursor + 8, cursor + 16), 16);
		let runto = runx & 0x7FFFFFFF; // mask off sign
		let ndiv = $("<div class='paramrun'/>");
		ndiv.css({left: (xpos + xPlotOffset) + 'px', bottom: (runVal + 2) + 'px', width: (runto - xpos) + 'px'});
		parentDiv.append(ndiv);
		cursor += 16;
		xpos = runto;
		runVal = nextVal;
	}
	// Handle last run in sequence
	if (xpos <= tracklen) {
		let ndiv = $("<div class='paramrun'/>");
		ndiv.css({left: (xpos + xPlotOffset) + 'px', bottom: (runVal + 2)  + 'px', width: (tracklen - xpos) + 'px'});
		parentDiv.append(ndiv);
	}

	let labdiv = $("<div class='parmlab'/>");
	labdiv.text(prefix + k);
	parentDiv.append(labdiv);
	parentDiv.css({width: (tracklen + xPlotOffset) + 'px'});
	elem.append(parentDiv);
}

var knobToParamNameTab = ["Pan", "Volume", "Res/FM", "Cutoff/FM",
 "Release","Attack", "Amount", "Delay Time",
 "Reverb", "Sidechain","Depth", "Mod Rate",
 "Custom 1", "Stutter", "Custom 3", "Custom 2"];


function plotParamLevel(prefix, track, trackW, elem)
{
	if (!track) return;
	for (var k in track) {
		if(track.hasOwnProperty(k)) {
			let v = track[k];
			if(typeof v === "string"&& v.startsWith('0x') && v.length > 10) {
				plotParamChanges(k, v, trackW, prefix, elem);
			}
		}
	}
}

function plotNoteLevelParams(noteRowA, track, trackW, elem)
{
	if (!noteRowA) return;
	let kitList = forceArray(track.kit.soundSources.sound);
	noteRowA = forceArray(noteRowA);
	for (var i = 0; i < noteRowA.length; ++i) {
		let aRow = noteRowA[i];
		let prefix = kitList[aRow.drumIndex].name + '.';
		plotParamLevel(prefix, aRow.soundParams, trackW, elem);
	}
}

function plotKnobLevelParams(knobs, track, trackW, elem)
{
	if (!knobs) return;
	for (var i = 0; i < knobs.length; ++i) {
		// if(typeof v === "string"&& v.startsWith('0x') && v.length > 10)
		let aKnob = knobs[i];
		let v = aKnob.value;
		if (typeof v === "string"&& v.startsWith('0x') && v.length > 10) {
			let prefix = "CC: " + aKnob.cc + " (" + knobToParamNameTab[i] + ")";
			plotParamChanges('', v, trackW, prefix, elem);
		}
	}
}

function plotParams(track, refTrack, elem) {
	let trackType = trackKind(track);
	let trackW = Number(track.trackLength);
	if (track.sound) plotParamLevel("sound.", track.sound, trackW, elem);
	if (track.defaultParams) plotParamLevel("default.", track.defaultParams, trackW, elem);
	if (track.soundParams) plotParamLevel("params.", track.soundParams, trackW, elem);

	if (track.kitParams) {
		plotParamLevel("kit.", track.kitParams, trackW, elem);
		if (track.noteRows) {
			plotNoteLevelParams(track.noteRows.noteRow, refTrack, trackW, elem);
		}
	}
	if (trackType == 'midi') {
		plotKnobLevelParams(forceArray(track.modKnobs.modKnob), track, trackW, elem);
	}
}

function trackKind(track) {
	if(track['kit']) return 'kit';
	if(track['sound']) return 'sound';
	if(track['midiChannel']) return 'midi';
	if(track['cvChannel']) return 'cv';
	// deal with indirect refs
	if(track['kitParams']) return 'kit';
	if(track['soundParams']) return 'sound';
	return 'unknown';
}

var trackKindNames = {"kit": "Kit",
					"sound": "Synth",
					"midi": "Midi",
					"cv": "CV",
					"unknown": "?",
					};

function trackHeader(track, kind, inx, repeatTab, obj) {
	let section = Number(track.section);
	let patchStr = "";

	let patch = Number(track.instrumentPresetSlot);

	if (kind === 'kit' || kind === 'sound') {
		patchStr = patch;
		let subpatch = Number(track.instrumentPresetSubSlot);
		if (subpatch >= 0) {
			patchStr += ' ';
			patchStr += String.fromCharCode(subpatch + 65); // 0 = a, 1 = b, …
		}
	}
	let info = "";
	if (track.soundMidiCommand) {
		info += "Midi in: " + (Number(track.soundMidiCommand.channel) + 1);
	}
	if (track.midiPGM) {
		if(info) info += ', ';
		info += "Midi program: " + (Number(track.midiPGM) + 1);
	}
	var patchName;
	if (kind === 'kit') {
		patchName = kitNames[patch];
	} else if (kind === 'midi') {
		patchStr = Number(track.midiChannel) + 1;
		patchName = '';
	} else if (kind === 'sound') {
		patchName = patchNames[patch];
	} else if (kind === 'cv') {
		patchStr = Number(track.cvChannel) + 1;
		patchName = '';
	}

	let repeats = Number(repeatTab[section].numRepeats);
	if (repeats === 0) repeats = '&#x221e;';
	 else if (repeats === -1) repeats = 'Share';
	let context = {
		len:			track.trackLength,
		patch: 			patchStr,
		colourOffset: 	track.colourOffset,
		patchName:		patchName,
		kindName: 		trackKindNames[kind],
		section: 		section,
		repeats:		repeats,
		info:			info,
		trackNum:		inx + 1,
		trackIndex:		inx,
	}
	let trtab = track_head_template(context);

	obj.append(trtab);
}

function getTrackText(trackNum)
{
	let songJ = jsonDocument.song;
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	let trackIX = trackA.length - trackNum - 1;
	let trackJ = trackA[trackIX];
	// Dereference referToTrackId if needed.
	var trackD;
	if (trackJ.instrument && trackJ.instrument.referToTrackId !== undefined) {
		let fromID = Number(trackJ.instrument.referToTrackId);
		trackD = {...trackJ}; // working copy
		delete trackD.instrument; // zonk reference
		let sourceT = trackA[fromID];
		// patch in data from source (depending on what type).
		let kind = trackKind(sourceT);
		if (kind === 'kit') {
			trackD["kit"] = sourceT["kit"];
		} else if (kind === 'sound') {
			trackD["sound"] = sourceT["sound"];
		} else {
			alert("Dangling reference to trackID: " + fromID + " kind: " + kind);
		}
	} else {
		trackD = trackJ;
	}
	// let asText = jsonToXMLString("track", trackD);
	let trackWrap = {"track": trackD};
	let asText = JSON.stringify(trackWrap, null, 1);
	return asText;
}

function trackCopyButton(trackNum, obj) {
	obj.append(track_copy_template({trackNum: trackNum}));
}

function soundViewButton(trackNum, obj) {
	obj.append(sound_view_template({trackNum: trackNum}));
}


/*******************************************************************************

		SONG

 *******************************************************************************
*/


class Song extends DRObject {

};

function pasteTrackText(text) {
	let pastedJSON = JSON.parse(text, (k, v)=>{
		return v;
	});
	// Clear the pasted-into-area
	setTimeout( function() {
		let ta =$("#paster")[0];
		ta.value = ta.defaultValue;
	}, 100);
	if (!pastedJSON || !pastedJSON.track) {
		alert("Invalid data on clipboard.");
		return;
	}

	// If needed, convert the tracks note format
	let clipUsingNewNotes = usesNewNotekFormat(pastedJSON.track);
	if (clipUsingNewNotes !== newNoteFormat) {
		if (newNoteFormat) {
			console.log('converting old note format to new');
			oldToNewNotes(pastedJSON.track);
		} else {
			console.log('converting new note format to old');
			newToOldNotes(pastedJSON.track);
		}
	}

	// Place the new track at the beginning of the track array
	let songJ = jsonDocument.song;
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	songJ.tracks.track = trackA; // If we forced an array, we want that permanent.
	// The beginning of the track array shows up at the screen bottom.
	trackA.unshift(pastedJSON.track);

	// Iterate thru the remaining tracks, updating the referToTrackId fields.
	for(var i = 1; i < trackA.length; ++i) {
		let aTrack = trackA[i];
		if (aTrack.instrument && aTrack.instrument.referToTrackId !== undefined) {
			let bumpedRef = Number(aTrack.instrument.referToTrackId) + 1;
			aTrack.instrument.referToTrackId = bumpedRef;
		}
	}

	// Now we try and element duplicate sound or kit elements
	// Since our new item was inserted at the front of the list, we search the remmaining tracks
	// for those that are equal to our element. We then replace their sound or kit with a referToTrackId of 0
	let track0 = trackA[0];
	let trackType;
	if (track0['sound']) trackType = 'sound';
	else if (track0['kit']) trackType = 'kit';
	if (trackType !== undefined) {
		for(var i = 1; i < trackA.length; ++i) {
			let aTrack = trackA[i];
			if (jsonequals(track0[trackType], aTrack[trackType])) {
				delete aTrack[trackType];
				aTrack.instrument = {"referToTrackId": 0};
				// Since the track we just put a referToTrackId into may have
				// been the target of another reference, check for that case and fix that too.
				for (var j = 1; j < trackA.length; ++j) {
					let bTrack = trackA[j];
					if (bTrack.instrument && Number(bTrack.instrument.referToTrackId) === i) {
						bTrack.instrument.referToTrackId = 0;
					}
				}
			}
		}
	}
	triggerRedraw();
}

function pasteTrackios(e) {
	
	let pasteel = $("#paster");
	if(pasteel && pasteel.length > 0) {
		let t = pasteel[0].value;
		pasteTrackText(t);
	}
}

function pasteTrack(e) {
	let clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData;

	let pastedData = clipboardData.getData('text');
	pasteTrackText(pastedData);
}

function trackPasteField(obj) {
	let iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
	let paster = paster_template({iOSDevice: iOSDevice});
	obj.append($(paster));

	if(iOSDevice) {
		$('#iosSubmit').on('click', pasteTrackios);
	} else {
		$('#paster').on('paste', pasteTrack);
	}
}



function songTail(jsong, obj) {
	formatSound(obj, jsong, jsong.songParams, jsong.defaultParams, jsong.soundParams);
}

// Return song tempo calculated from timePerTimerTick and timerTickFraction
function convertTempo(jsong)
{
	let fractPart = (jsong.timerTickFraction>>>0) / 0x100000000;
	let realTPT = Number(jsong.timePerTimerTick) + fractPart;
	
	let tempo = Math.round(120.0 * realTPT / 459.375);
	return tempo;
}

function scanSamples(json, sampMap) {
	for (var k in json) {
		if(json.hasOwnProperty(k)) {
			// Have we found something?
			let v = json[k];
			if (k === 'fileName' && typeof v === "string") {
				sampMap.add(v);
			} else
			if (v.constructor === Array) {
				for(var ix = 0; ix < v.length; ++ix) {
					let aobj = v[ix];
					if (aobj.constructor == Array || aobj.constructor == Object) {
						scanSamples(v[ix], sampMap);
					}
				}
			} else if(v.constructor === Object) {
				scanSamples(v, sampMap);
			}
		}
	}
}

function sampleReport(json, showAll, obj) {
	var sampSet = new Set();
	scanSamples(json, sampSet);
	var sampList = Array.from(sampSet);
	if (!showAll) {
		sampList = sampList.filter(function (n) {
			return !n.startsWith('SAMPLES/DRUMS/');
		});
	}
	sampList.sort();
	obj.append(sample_list_template({sample_path_prefix: sample_path_prefix, sampList: sampList, showDrums: showAll}));
}

function genSampleReport(track)
{
	let isChecked = $("#showdrums").is(':checked');
	$('#samprepplace table').remove();
	sampleReport(track, isChecked, $('#samprepplace'));
	$('#showdrums').on('click', function () {
		genSampleReport(track);
	});
}

var scaleTable = [
"Major",	[0, 2, 4, 5, 7, 9, 11],
"Minor",	[0, 2, 3, 5, 7, 8, 10],
"Dorian",	[0, 2, 3, 5, 7, 9, 10],
"Phrygian", [0, 1, 3, 5, 7, 8, 10],
"Lydian", 	[0, 2, 4, 6, 7, 9, 11],
"Mixolydian", [0, 2, 4, 5, 7, 9, 10],
"Locrian", 	[0, 1, 3, 5, 6, 8, 10] ];

function scaleString(jsong) {
	let str = noteNames[Number(jsong.rootNote) % 12] + " ";

	let modeTab = jsong.modeNotes.modeNote;
	let modeNums = Array(7);
	for (var j = 0; j < 7; ++j) modeNums[j] = Number(modeTab[j]);
	for (var i = 0; i < scaleTable.length; i += 2) {
		let aMode = scaleTable[i + 1];
		if (jsonequals(modeNums, aMode)) {
			return str + scaleTable[i];
		}
	}
	return str + "Chromatic";
}

function formatSong(jsong, obj) {
	let ctab = genColorTab(jsong.preview);
	obj.append(ctab);
	obj.append($("<p class='tinygap'>"));
	obj.append("Tempo = " + convertTempo(jsong) + " bpm");
	let swing = Number(jsong.swingAmount);
	if(swing !== 0) {
		swing += 50;
		let sync = Number(jsong.swingInterval);
		obj.append(", Swing = " + swing + "% on " + syncLevelTab[sync]);
	}
	obj.append(", Key = " + scaleString(jsong));
	obj.append($("<p class='tinygap'>"));
	let sectionTab = forceArray(jsong.sections.section);

	if(jsong.tracks) {
	  let trax = forceArray(jsong.tracks.track);
	  if (trax) {
		for(var i = 0; i < trax.length; ++i) {
			// obj.append($("<h3/>").text("Track " + (i + 1)));
			let track = trax[trax.length - i - 1];
			let tKind = trackKind(track);
			let refTrack = track;
			if (track.instrument && track.instrument.referToTrackId !== undefined) {
				let fromID = Number(track.instrument.referToTrackId);
				refTrack = trax[fromID];
			}
			trackHeader(track, tKind, i, sectionTab, obj);
			if(tKind === 'kit') {
				plotKit(track, refTrack, obj);
			} else {
				plotTrack(track, obj);
			}
			plotParams(track, refTrack, obj);
		}
		activateNoteTips();
	  }

	}
	trackPasteField(obj);
	songTail(jsong, obj);
	obj.append($("<div id='samprepplace'></div>"));
	genSampleReport(jsong);

	// Populate copy to clippers.
	new Clipboard('.clipbtn', {
	   text: function(trigger) {
		let asText = getTrackText(trigger.getAttribute('trackno'));
		return asText;
	}
	});
	$(".soundviewbtn").on('click', function(e) {
		viewSound(e);
	});
}

function formatModKnobs(knobs, title, obj)
{
	let context = {title: title};
	for(var i = 0; i < knobs.length; ++i) {
		let kName = 'mk' + i;
		let aKnob = knobs[i];
		if (aKnob.controlsParam) {
			context[kName] = aKnob.controlsParam;
		}
	}
	obj.append(modKnobTemplate(context));
}

function formatModKnobsMidi(knobs, obj)
{
	let context = {};
	for(var i = 0; i < knobs.length; ++i) {
		let kName = 'mk' + i;
		let aKnob = knobs[i];
		if (aKnob.cc) {
			context[kName] = aKnob;
		}
	}
	obj.append(midiModKnobTemplate(context));
}



function formatSampleEntry(sound, obj, ix)
{
	let context = jQuery.extend(true, {}, sound);
	context.index = ix;
	context.sample_path_prefix = sample_path_prefix;

	// If Osc2 does not have a sample defined for it, strike osc2 from the context
	if (!context.osc2 || !context.osc2.fileName || $.isEmptyObject(context.osc2.fileName)) {
		delete context.osc2;
	}
	obj.append(sample_entry_template(context));
}

/*******************************************************************************

		Top Level

 *******************************************************************************
*/

function jsonToTopTable(json, obj)
{
	$('#fileTitle').html(fname);
	if(json['song']) {
		formatSong(json.song, obj);
	} else if(json['sound']) {
		formatSound(obj, json.sound, json.sound.defaultParams, json.sound.soundParams);
	} else if(json['kit']) {
		formatKit(json.kit, obj, json.kitParams);
	} else {
		jsonToTable(json, obj);
	}
}


// Trigger redraw of displayed object(s).
function triggerRedraw() {
	$('#jtab').empty();
	jsonToTopTable(jsonDocument, $('#jtab'));
}

var nameToClassTab = {
	'kit':		Kit,
	'track':	Track,
	'sound':	Sound,
	'song':		Song
};

/*******************************************************************************

		 File and GUI

 *******************************************************************************
*/
function openLocal(evt)
{
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var reader = new FileReader();
// Closure to capture the file information.
	reader.onload = (function(theFile) {
		return function(e) {
			// Display contents of file
				let t = e.target.result;
				setEditText(t);
			};
		})(f);

	// Read in the image file as a data URL.
	reader.readAsText(f);
}

//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		fname = decodeURI(urlarg);
	}

	if(!local_exec) {
		loadFile(fname);
	} else {
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$('#jtab').append (local_exec_info());
		$('#opener').on('change', openLocal);
		if (custom_sample_path) {
			sample_path_prefix = custom_sample_path;
		} else {
			if (document.URL.indexOf('DR/xmlView')> 0) {
				sample_path_prefix = '../../';
			} else if (document.URL.indexOf('xmlView')> 0) {
				sample_path_prefix = '../';
			} else sample_path_prefix = '';
		}
	}
	setupGUI();
}
window.onload = onLoad;

  function saveAs(){
	saveFileBrowser({
		initialPath: fname,
		saver: function(name) {
			save(name);
		}
	});
}

function setupGUI()
{
	$('.savebut').click(e=>{saveAs(e)});
	
	$('.openbutn').click(e=>{
		let initial = fname;
		if (!initial) initial = '/';
		openFileBrowser({
			initialPath:  initial,
			opener: function(name) {
				loadFile(name);
				fname = name;
			}
		});
	});
}

//editor
function setEditText(text)
{
	// Capture the current firmware version and then remove that from the string.
	let firmHits = /<firmwareVersion>.*<.firmwareVersion>/i.exec(text);
	if (firmHits && firmHits.length > 0) {
		firmwareVersionFound = firmHits[0];
	} else {
		firmwareVersionFound='';
	}

	newNoteFormat = !(firmwareVersionFound.indexOf('1.2') >= 0 || firmwareVersionFound.indexOf('1.3') >= 0);
	var fixedText = text.replace(/<firmwareVersion>.*<.firmwareVersion>/i,"");
	var asDOM = getXmlDOMFromString(fixedText);
	// Uncomment following to generate ordering table based on a real-world example.
	// enOrderTab(asDOM);
	var asJSON = xmlToJson(asDOM);
	jsonDocument = asJSON;
	$('#jtab').empty();
	jsonToTopTable(asJSON, $('#jtab'));
}

// use ajax to load wav data (instead of a web worker).
  function loadFile(fname)
{
	$("#statind").text("Loading: " +  fname);
	$.ajax({
	url         : fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		setEditText(data);
		$("#statind").text(fname + " loaded.");
	},

	error: function (data, textStatus, jqXHR) {
		console.log("Error: " + textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType= 'text';
		return xhr;
	},

	});
}

function save(toName) {
	let headerStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
	if (firmwareVersionFound) {
		headerStr += firmwareVersionFound + "\n";
	}
 	let saveText = headerStr + jsonToXMLString("song", jsonDocument.song);
 	fname = toName;
	saveFile(toName, saveText);
}

// use ajax to save-back wav data (instead of a web worker).
  function saveFile(filepath, data)
{
	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&TIME="+(Date.now());;
	$.get(urlDateSet, function() {
		$.ajax(filepath, {
		headers:	{'Overwrite': 't', 'Content-type': 'text/plain'},
		cache:		false,
		contentType: false,
		data:		data,
		processData : false,
		method:		'PUT',
		error:		function(jqXHR, textStatus, errorThrown) {
			alert(textStatus + "\n" + errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			console.log("Save OK");
			$.ajax("/upload.cgi?WRITEPROTECT=OFF",{
				error:	function(jqXHR, textStatus, errorThrown) {
					alert(textStatus + "\n" + errorThrown);
				},
				headers: {"If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"},
				success: function(data, textStatus, jqXHR){
					console.log("save and unlock done");
					$("#statind").text(filepath + " saved.");
				},
			})
		},
		
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
		  	xhr.upload.addEventListener("progress", function(evt){
			  if (evt.lengthComputable) {
				  var percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				  //Do something with upload progress
				 $("#statind").text(filepath + " " + percentComplete + "%");
				 //console.log(percentComplete);
			  }
			}, false);
		 	return xhr;
		 }
		});
	});
}
