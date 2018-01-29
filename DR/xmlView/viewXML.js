"use strict";
// while this program is called viewXML, in reality we use JSON internally
// and convert from XML to JSON on load, from JSON to XML on save.

var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;

var fname = "";

var jsonDocument;

var xPlotOffset = 32;
	
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
function xmlToJson(xml) {
  // Create the return object
  let obj = {};

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
	  if (typeof (obj[nodeName]) === 'undefined') {
		obj[nodeName] = xmlToJson(item);
	  } else {
		if (typeof (obj[nodeName].push) === 'undefined') {
		  const old = obj[nodeName];
		  obj[nodeName] = [];
		  obj[nodeName].push(old);
		}
		obj[nodeName].push(xmlToJson(item));
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
	for(var ek in j) {
		if(j.hasOwnProperty(ek) && ek != "@attributes") {
			let v = j[ek];
			if (v.constructor === Array) {
				for(var i = 0; i < v.length; ++i) {
					insides += jsonToXML(ek, v[i], d + 1);
				}
			} else if (v.constructor == Object) {
				insides += jsonToXML(ek, v, d + 1);
			} else {
				// Simple k/v pair
				if(typeof v === "string") v = v.trim();
				insides += jsonToXML(ek, v, d);
				// insides += gentabs(d) + "<" + ek + ">" + v + "</" + ek + ">\n";
			}
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

var noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
	let colTab = $('<table/>');
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

// Convert Midi note number into note name + octave, with 0 meaning C minus 2
function yToNoteName(note)
{
	let oct = Math.round(note / 12) - 2;
	let tone = note % 12;
	return noteNames[tone] + oct;
}

function plotTrack(track, obj) {
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
		if (y < 0) continue;
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = Number(n.pos) + xPlotOffset;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;
			let ndiv = $("<div class='trnote'/>");
			let ypos = (y- ymin) * 4 + 2;
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px'});
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

function plotNoteName(note, style, parentDiv) {
	let labName = yToNoteName(note);
	if (labName != undefined) {
		let labdiv = $("<div class='notelab'/>");
		labdiv.text(labName);
		labdiv.css(style);
		parentDiv.append(labdiv);
	}
}

function plotKit(track, obj) {
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
	// obj.append("<p clear='both'>");
	let kitList = forceArray(track.kit.soundSources.sound);
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		let ypos = (y- ymin) * kitItemH;

		if (row.drumIndex) {
			let rowInfo = kitList[row.drumIndex];
			let labName = rowInfo.name;
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
			let x = Number(n.pos) + xPlotOffset;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;
			let ndiv = $("<div class='trkitnote'/>");

			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	obj.append(parentDiv);
}


function plotParamChanges(k, ps, tracklen, elem)
{
	elem.append($("<p class='tinygap'/>"));
	let parentDiv = $("<div class='parmplot'/>");
	let cursor = 10;
	let xpos = 0;
	let textH = 8;

	while (cursor < ps.length) {
		let val = parseInt(ps.substring(cursor, cursor + 8), 16);
		let runx = parseInt(ps.substring(cursor + 8, cursor + 16), 16);
		// Convert val to signed 32 bit.
		if (val & 0x80000000) {
			val -= 0x100000000;
		}
		let ranged = Math.round( ((val + 0x80000000) * 50) / 0x100000000);
		let runto = runx & 0x7FFFFFFF; // mask off sign
		let ypos = 60 - textH - ranged;
		let w = runto - xpos;
		let xoff = xpos + xPlotOffset;
		let ndiv = $("<div class='paramrun'/>");
		ndiv.css({left: xoff + 'px', bottom: ypos + 'px', width: w + 'px'});
		parentDiv.append(ndiv);
		cursor += 16;
		xpos = runto;
	}
	let labdiv = $("<div class='parmlab'/>");
	labdiv.text(k);
	parentDiv.append(labdiv);
	parentDiv.css({width: (tracklen + xPlotOffset) + 'px'});
	elem.append(parentDiv);
}


function plotParamLevel(track, trackW, elem)
{
	for (var k in track) {
		if(track.hasOwnProperty(k)) {
			let v = track[k];
			if(typeof v === "string"&& v.startsWith('0x') && v.length > 10) {
				plotParamChanges(k, v, trackW, elem);
			}
		}
	}
}

function plotParams(track, elem) {
	let trackW = Number(track.trackLength);
	if (track.sound) plotParamLevel(track.sound, trackW, elem);
	if (track.defaultParams) plotParamLevel(track.defaultParams, trackW, elem);
	if (track.soundParams) plotParamLevel(track.soundParams, trackW, elem);
	
	if (track.kitParams) plotParamLevel(track.kitParams, trackW, elem);
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

function trackHeader(track, kind, inx, obj) {
	let section = track.section;
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
		info += "Midi in: " + track.soundMidiCommand.channel;
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

	let context = {
		len:			track.trackLength,
		patch: 			patchStr,
		colourOffset: 	track.colourOffset,
		patchName:		patchName,
		kindName: 		trackKindNames[kind],
		section: 		section,
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
		trackD = Object.assign({}, trackJ); // working copy
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
function pasteTrackText(text) {
	
	let pastedJSON = JSON.parse(text);
	// Clear the pasted-into-area
	setTimeout( function() {
		let ta =$("#paster")[0];
		ta.value = ta.defaultValue;
	}, 100);
	if (!pastedJSON || !pastedJSON.track) {
		alert("Invalid data on clipboard.");
		return;
	}
	// Place the new track at the beginning of the track array
	let songJ = jsonDocument.song;
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	// The beginning of the track array shows up at the screen bottom.
	trackA.unshift(pastedJSON.track);

	// Iterate thru the remaining tracks, updating the referToTrackId fields.
	for(var i = 1; i < trackA.length; ++i) {
		let aTrack = trackA[i];
		if (aTrack.instrument && aTrack.instrument.referToTrackId !== undefined) {
			aTrack.instrument.referToTrackId++;
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

function horizontalArray(arr, obj, title) {
	let trtab = $("<table class='repeats'/>");
	if(title) {
		let trt = $("<tr/>");
		trt.append($("<th colspan='" + arr.length +"'/>").html(title));
		trtab.append(trt);
	}
	let trh = $("<tr/>");
	for(var i = 0; i < arr.length; ++i) {
		trh.append($("<th/>").html(i + 1));
	}
	trtab.append(trh);
	
	let trd = $("<tr/>");
	for(var i = 0; i < arr.length; ++i) {
		let rc = "" + arr[i];
		trd.append($("<td/>").html(rc));
	}
	trtab.append(trd);
	
	obj.append(trtab);
}

function sectionRepeats(arr, obj) {
	let repL = [];
	let totalRepeats = 0;
	for(var i = 0; i < arr.length; ++i) {
		let rc = arr[i].numRepeats;
		totalRepeats += rc;
		repL[i] = rc;
	}
	if (totalRepeats > 0) {
		horizontalArray(repL, obj, "Section Repeats");
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
	obj.append(sample_list_template({sampList: sampList, showDrums: showAll}));
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

function formatSong(jsong, obj) {
	let ctab = genColorTab(jsong.preview);
	obj.append(ctab);
	obj.append($("<p class='tinygap'>"));
	obj.append("Tempo = " + convertTempo(jsong) + " bpm");
	obj.append($("<p class='tinygap'>"));
	if(jsong.sections) {
		sectionRepeats(jsong.sections.section, obj);
	}
	if(jsong.tracks) {
	  let trax = forceArray(jsong.tracks.track);
	  if (trax) {
		for(var i = 0; i < trax.length; ++i) {
			// obj.append($("<h3/>").text("Track " + (i + 1)));
			let track = trax[trax.length - i - 1];
			let tKind = trackKind(track);
			trackHeader(track, tKind, i, obj);
			if(tKind === 'kit') {
				plotKit(track, obj);
			} else {
				plotTrack(track, obj);
			}
			plotParams(track, obj);
		}
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

function fixhex(v) {
	if(v === undefined) return v;
	if(typeof v !== "string") return v;
	if (v.startsWith('0x')) {

		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		let ranged = Math.round( ((asInt + 0x80000000) * 50) / 0x100000000);
		if (v.length > 10) {
			ranged += '…';
		}
		return ranged;
	} else return v;
}

function fixpan(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		let rangedm32to32 = Math.round( ((asInt + 0x80000000) * 64) / 0x100000000) - 32;
		if (rangedm32to32 === 0) return 0;
		if (rangedm32to32 < 0) return Math.abs(rangedm32to32) + 'L';
		return rangedm32to32 + 'R';
	} else return v;
}

// Vibrato 
function fixvibrato(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		// vibrato ranges from 0xC0000000 to 0x3FFFFFF, and we want to show it
		// as -50 to 50
		return Math.round( ((asInt + 0x80000000) * 200) / 0x100000000) - 100;
	} else return v;
}


Handlebars.registerHelper('fixh', fixhex);
Handlebars.registerHelper('fixpan',fixpan);

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

Handlebars.registerHelper('shrinkifneeded', function (s) {
	if(s === undefined) return "";
	if (s.length <= 6) {
		return s;
	}
	return"<div class='textsm2'>" + s + "</div>";
});

var syncLevelTab = ["off", "4 bars", "2 bars", "1 bar", "2nd", "4th", "8th", "16th", "32nd", "64th"];

Handlebars.registerHelper('fmtsync', function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	return syncLevelTab[tvn];
});234624

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

function formatModKnobs(knobs, title, obj)
{
	let context = {title: title};
	for(var i = 0; i < knobs.length; ++i) {
		let kName = 'mk' + i;
		context[kName] = knobs[i].controlsParam;
	}
	obj.append(modKnobTemplate(context));
}

function formatSampleEntry(sound, obj, ix)
{
	let context = jQuery.extend(true, {}, sound);
	context.index = ix;

	// If Osc2 does not have a sample defined for it, strike osc2 from the context
	if (!context.osc2 || !context.osc2.fileName || $.isEmptyObject(context.osc2.fileName)) {
		delete context.osc2;
	}
	obj.append(sample_entry_template(context));
}


function formatSound(obj, json, json1, json2, json3)
{
	let context = jQuery.extend(true, {}, json);
	
	if (json1) {
		jQuery.extend(true, context, json1);
	}
	if (json2) {
		jQuery.extend(true, context, json2);
	}
	if(json3) {
		jQuery.extend(true, context, json3);
	}

	if (context.midiKnobs && context.midiKnobs.midiKnob) {
		formatModKnobs(context.modKnobs.modKnob, "Midi Parameter Knob Mapping", obj);
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
				let vibratoVal = fixvibrato(cable.amount);
				context['vibrato'] = vibratoVal;
			}
			let amount = fixhex(cable.amount);
			let info = aDest + "(" + amount + ")";
			let val = destMap[sName];
			if (val) val += ' ';
				else val = "";
			val += info;
			destMap[sName]  = val;
		}
		
		jQuery.extend(true, context, destMap);
	}

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
	   if (trackD.soundParams || trackD.sound) {
	   	target.textContent = "▼";
		formatSound(where, trackD.sound, trackD.soundParams);
	  } else if (trackD.kit) {
	   		target.textContent = "▼";
			let kitroot = trackD.kit;
			if (trackD['soundSources']) {
				kitroot = trackD;
			}
			formatKit(kitroot, where);
		}
	 }
}

function openKitSound(e, kitTab) {
	let target = e.target;
	let ourX = Number(target.getAttribute('kitItem'));

	let ourRow = target.parentNode;
	let nextRow = ourRow.nextElementSibling;
	let ourTab = ourRow.parentNode;
	if (nextRow && nextRow.classList.contains('soundentry')) {
		ourTab.removeChild(nextRow);
		target.textContent = "►";
		return;
	}
	var aKitSound = kitTab[ourX];
	let newRow = $("<tr class='soundentry'/>");
	let newData =$("<td  colspan='8'/>");

	formatSound(newData, aKitSound, aKitSound.defaultParams, aKitSound.soundParams);
	// formatKitSoundEntry(aKitSound, newData);
	newRow.append(newData);
	if (nextRow) {
		ourTab.insertBefore(newRow[0], nextRow); 
	} else {
		ourTab.appendChild(newRow[0]);
	}
	target.textContent = "▼";
}

function formatKit(json, obj) {
	
	let kitList = forceArray(json.soundSources.sound);
	
	let tab = $("<table class='kit_tab'/>");
	tab.append(sample_list_header());
	
	for(var i = 0; i < kitList.length; ++i) {
		let kit = kitList[i];
		formatSampleEntry(kit, tab, i);
	}
	
	
	obj.append(tab);

	let opener = function (e) {
		openKitSound(e, kitList);
	};
	$('.kit_opener').on('click', opener);
}

function jsonToTopTable(json, obj)
{
	$('#fileTitle').html(fname);
	if(json['song']) {
		formatSong(json.song, obj);
	} else if(json['sound']) {
		formatSound(obj, json.sound, json.sound.defaultParams, json.sound.soundParams);
	} else if(json['kit']) {
		formatKit(json.kit, obj, true);
	} else {
		jsonToTable(json, obj);
	}
}


// Trigger redraw of song
function triggerRedraw() {
	$('#jtab').empty();
	jsonToTopTable(jsonDocument, $('#jtab'));
}

/**********************************************************************************

*/


function modeChanger(filename)
{
	// Extension discrimination
	var splitname = filename.split(".");
	var len = splitname.length;
}

//------ Tool button management--------
var showToolFlag=false;
function showTool()
{
		if(showToolFlag)
		{
			document.getElementById("ToolButtons1").style.display="none";
			showToolFlag=false;
		}else{
			document.getElementById("ToolButtons1").style.display="block";
			showToolFlag=true;
		}
}

// Page transition warning

var unexpected_close = true;
/*
window.onbeforeunload = function(event){
	if(unexpected_close && !jsEditor.isClean())
	{
		event = event || window.event;
		event.returnValue = "Exit?";
	}
}
*/

//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		filename_input.value = decodeURI(urlarg);
	}

//	postWorker("eva");
//	modeChanger(filename_input.value);
	postWorker("load");
	fname = filename_input.value;
	// jsEditor.markClean();
}
window.onload = onLoad;

//-------keyin--------
document.onkeydown = function (e){
	if(!e) e = window.event;

	if(e.keyCode == 112) //F1
	{
		btn_save();
		return false;		
	}

	if(e.keyCode == 123) //F12
	{
		btn_load();
		return false;		
	}
	if(e.keyCode == 118) //F7
	{
		btn_unlock();
		return false;		
	}

	if(e.keyCode == 120) //F9
	{
		btn_getmsg();
		return false;		
	}
};



//---------Button-----------

//CONFIG
function btn_config()
{
//	if(window.confirm('Load /SD_WLAN/CONFIG?'))
//	{
		filename_input.value="/SD_WLAN/CONFIG";
		modeChanger(filename_input.value);
		postWorker("load");
//	}
}

//Load
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		modeChanger(filename_input.value);
		postWorker("load");
		fname = filename_input.value;
//	}
	// jsEditor.markClean();
}

//Save

function btn_save(){

	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("save");
	// jsEditor.markClean();
}

// Unlock
function btn_unlock(){
	postWorker("unlock");
}

//GetMsgボタン
function btn_getmsg()
{
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/command.cgi?op=130&ADDR=0x01&LEN=0xFE");
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout=3000;
	xhr.onload = function(){
		if (xhr.status == 200) {
			addStat("*GetMsg: "+xhr.responseText);
		}else {
			addStat("*GetMsg: "+xhr.statusText);
		}
	};
	xhr.onerror = function(){addStat("*GetMsg: "+xhr.statusText);};
	xhr.send();
}

//Menuボタン
function btn_menu()
{

	unexpected_close=false; //ページ脱出警告を無効化
	location.href="/DR/Downrush.lua";
}

//---------handler-----------

var status_str="";
//statusをクリアする
function clrStat()
{
	status_str="";
	stat_output.value = status_str;
}
// add one line to status
function addStat(x)
{
	status_str += "\n" + x;
	stat_output.value = status_str;
	stat_output.scrollTop = stat_output.scrollHeight;
}


//editor
function setEditText(text)
{
	var fixedText = text.replace(/<firmwareVersion>1.3.\d<.firmwareVersion>/i,"");
	var asDOM = getXmlDOMFromString(fixedText);
	var asJSON = xmlToJson(asDOM);
	jsonDocument = asJSON;

	jsonToTopTable(asJSON, $('#jtab'));
}

// Set editor highlight
function setLineHighlight(lineno)
{// and removeLineClass, 
//	var h = jsEditor.getLineHandle(lineno - 1);
//	jsEditor.addLineClass(h, "background", "error-line");
}

//Workerに投げる
function postWorker(mode)
{
	var saveText  = "";
	if(mode === 'save' && jsonDocument.song) {
		let headerStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
		saveText = headerStr + jsonToXMLString("song", jsonDocument.song);
	}
	// Set CRLF to LF and then to CRLF. (LF also becomes CRLF)
	//var code_body_lf = code_body.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");

	var msg = {
		filepath: filename_input.value,
		arg: "", // arg_input.value,
		mode: mode,
		edit: saveText,
	};
	worker.postMessage(msg);
}

//------------Worker---------------
if (!window.Worker) {
	alert("Web Worker disabled! Editor won't work!")
}

var worker;
try {
	worker = new Worker("XMLworker.js");
}catch (e) {
	addStat("Exception!(UI): "+e.message);
}
worker.onmessage = function(e) {
	// RPC outfitting

	//debug
	if(e.data.func == "console.log")
	{
		console.log(e.data.arg);
	}
	if(e.data.func == "clearStatus")
	{
		clrStat();
	}
	if(e.data.func == "addStatus" || e.data.func == "setResponse")
	{
		addStat(e.data.arg);
	}
	if(e.data.func == "setEditor")
	{
		setEditText(e.data.arg);
	}
	if(e.data.func == "setLineHighlight")
	{
		setLineHighlight(e.data.arg);
	}
};

