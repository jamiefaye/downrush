"use strict";
// while this program is called viewXML, in reality we use JSON internally
// and convert from XML to JSON on load, from JSON to XML on save.

var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;

var ckh = document.getElementById ("chk");

var fname = "";

var jsonDocument;

	
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
	let y = Number(row.y);
	if (y === -32768) {
		if (row.drumIndex) {
			y = row.drumIndex;
		}
	}

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
	let lowNote = yToNoteName(ymin);
	let hiNote = yToNoteName(ymax);
	let totH = ((ymax - ymin) + 1) * 4;
	obj.append(hiNote);
	parentDiv.css({height: totH + 'px'});
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		if (y < 0) continue;
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = n.pos;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;
			let ndiv = $("<div class='trnote'/>");
			let ypos = (y- ymin) * 4 + 2;
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	obj.append(parentDiv);
	obj.append(lowNote);
}

function trackKind(track) {
	if(track['kit']) return 'kit';
	if(track['sound']) return 'sound';
	if(track['midiChannel']) return 'midi';
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

function trackHeader(track, inx, obj) {
	let section = track.section;
	let kind = trackKind(track);
	let patch = Number(track.instrumentPresetSlot);
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
		patch = Number(track.midiChannel) + 1;
		patchName = '';
	} else if (kind === 'sound') {
		patchName = patchNames[patch];
	}

	let context = {
		len:			track.trackLength,
		patch: 			patch,
		colourOffset: 	track.colourOffset,
		patchName:		patchName,
		kindName: 		trackKindNames[kind],
		section: 		section,
		info:			info,
		trackNum:		inx,
	}
	let trtab = Mustache.to_html(track_head_template, context);

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
	obj.append(Mustache.to_html(track_copy_template, {trackNum: trackNum}));
}

function soundViewButton(trackNum, obj) {
	obj.append(Mustache.to_html(sound_view_template, {trackNum: trackNum}));
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
	let paster = Mustache.to_html(paster_template, {iOSDevice: iOSDevice});
	obj.append($(paster));

	if(iOSDevice) {
		$('#iosSubmit').on('click', pasteTrackios);
	} else {
		$('#paster').on('paste', pasteTrack);
	}
}

function horizontalArray(arr, obj, title) {
	let trtab = $('<table/>');
	if(title) {
		let trt = $("<tr/>");
		trt.append($("<th colspan='" + arr.length +"'/>").html(title));
		trtab.append(trt);
	}
	let trh = $("<tr/>");
	for(var i = 0; i < arr.length; ++i) {
		trh.append($("<th/>").html(i));
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
	for(var i = 0; i < arr.length; ++i) {
		repL[i] = arr[i].numRepeats;
	}
	horizontalArray(repL, obj, "Section Repeats");
}

function songTail(jsong, obj) {
	// formatSound(obj, jsong, jsong.songParams, jsong.defaultParams, jsong.soundParams);
}

// Return song tempo calculated from timePerTimerTick and timerTickFraction
function convertTempo(jsong)
{
	let fractPart = (jsong.timerTickFraction>>>0) / 0x100000000;
	let realTPT = Number(jsong.timePerTimerTick) + fractPart;
	
	let tempo = Math.round(120.0 * realTPT / 459.375);
	return tempo;
}

function formatSong(jsong, obj) {
	let ctab = genColorTab(jsong.preview);
	obj.append(ctab);
	obj.append("Tempo = " + convertTempo(jsong) + " bpm");
	if(jsong.sections) {
		sectionRepeats(jsong.sections.section, obj);
	}
	if(jsong.tracks) {
	  let trax = forceArray(jsong.tracks.track);
	  if (trax) {
		for(var i = 0; i < trax.length; ++i) {
			obj.append($("<h3/>").text("Track number " + (i + 1)));
			trackCopyButton(i, obj);
			trackHeader(trax[trax.length - i- 1], i, obj);
			plotTrack(trax[trax.length - i- 1], obj);
		}
	  }
	}
	trackPasteField(obj);
	songTail(jsong, obj);
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

// Recur down a JSON object, replacing all string values that
// contain hexidecimal constants with numbers 	
function cleanUpParams(json, formatters) {
	for (var k in json) {
		if(json.hasOwnProperty(k)) {
			if(formatters && formatters[k]) {
				let v = formatters[k](json, k);
				json[k] = v;
				continue;
			}

			let v = json[k];
			if (v.constructor === Array) {
				for(var ix = 0; ix < v.length; ++ix) {
					cleanUpParams(v[ix], formatters);
				}

			} else if(v.constructor === Object) {
					cleanUpParams(v);
			} else
				if(typeof v === "string") {
				if (v.startsWith('0x')) {
					
					let asInt= parseInt(v.substring(2, 18), 16);
					// Convert to signed 32 bit.
					if (asInt & 0x80000000) {
						asInt -= 0x100000000;
					}
					let ranged = Math.round( ((asInt + 0x80000000) * 50) / 0x100000000) ;
					json[k] = ranged;
					//console.log(k + " converting: " + v + " to: " + ranged);
				}
			}
		}
	}
}

function fixRebParm(v) {

	if(typeof v === "string" && v.startsWith('0x')) return v;
	let vn = Number(v);
	let ranged = Math.round( (vn * 50) / 0x7FFFFFFF);
	return ranged;
}

function cleanUpReverb(json) {
	let reverb = json.reverb;
	if(reverb) {
		reverb.roomSize = fixRebParm(reverb.roomSize);
		reverb.dampening = fixRebParm(reverb.dampening);
		reverb.width = fixRebParm(reverb.width);
		let fpan = fixRebParm(reverb.pan);
		reverb.pan = fpan; //  - 25;
	}
}

function formatModKnobs(knobs, title, obj)
{
	let context = {title: title};
	for(var i = 0; i < knobs.length; ++i) {
		let kName = 'mk' + i;
		context[kName] = knobs[i].controlsParam;
	}
	obj.append(Mustache.to_html(modKnobTemplate, context));
}

function formatTime(tv)
{
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
}
function formatSampleEntry(sound, obj, ix)
{
	let context = {index: ix};
	if (sound.name) context.sound_name = sound.name;
	

	if (sound.osc1) {
		if (sound.osc1.fileName) context.fileName = sound.osc1.fileName;
		if (sound.osc1.zone) {
			if (sound.osc1.zone.startMilliseconds) context.startTime = formatTime(sound.osc1.zone.startMilliseconds);
			if (sound.osc1.zone.endMilliseconds) context.endTime = formatTime(sound.osc1.zone.endMilliseconds);
		}
	}

	// If Osc2 also has a sample, note that.
	if (sound.osc2 && sound.osc2.fileName && sound.osc2.fileName.length > 0) {

		context.fileName2 = sound.osc2.fileName;
		if (sound.osc2.zone) {
			if (sound.osc2.zone.startMilliseconds) context.startTime2 = formatTime(sound.osc2.zone.startMilliseconds);;
			if (sound.osc2.zone.endMilliseconds) context.endTime2 = formatTime(sound.osc2.zone.endMilliseconds);
		}
	}

	obj.append(Mustache.to_html(sample_entry_template, context));
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

	cleanUpReverb(context);
	cleanUpParams(context);

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
			let amount = cable.amount;
			let info = aDest + "(" + amount + ")";
			let val = destMap[sName];
			if (val) val += ' ';
				else val = "";
			val += info;
			destMap[sName]  = val;
		}
		jQuery.extend(true, context, destMap);
	}
	obj.append(Mustache.to_html(sound_template, context));
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


function formatKitSoundEntry(json, obj, showJSON)
{
	let working = jQuery.extend(true, {}, json);
	jQuery.extend(true, working, json.defaultParams);
	// Override with soundParameters if present.
	if(json.soundParamters) {
		jQuery.extend(true, working, json.soundParams);
	}
	cleanUpReverb(working);
	cleanUpParams(working);
//	for (var k in working) {
//		console.log(k);
//	}

	let context = working;

	if (working.midiKnobs && working.midiKnobs.midiKnob) {
		formatModKnobs(working.modKnobs.modKnob, "Midi Parameter Knob Mapping", obj);
	}

	if (working.modKnobs && working.modKnobs.modKnob) {
		formatModKnobs(working.modKnobs.modKnob, "Parameter Knob Mapping", obj);
	}

	// Populate mod sources fields with specified destinations
	if (working.patchCables) {
		let destMap = {};
		let patchA = forceArray(working.patchCables.patchCable);
		for (var i = 0; i < patchA.length; ++i) {
			let cable = patchA[i];
			let sName = "m_" + cable.source;
			let aDest = cable.destination;
			let amount = cable.amount;
			let info = aDest + "(" + amount + ")";
			let val = destMap[sName];
			if (val) val += ' ';
				else val = "";
			val += info;
			destMap[sName]  = val;
		}
		jQuery.extend(true, working, destMap);
	}
	obj.append(Mustache.to_html(sound_template, context));

	if (showJSON) {
		jsonToTable(working, obj);
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
	formatKitSoundEntry(aKitSound, newData, false);
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
	tab.append(Mustache.to_html(sample_list_header));
	
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
	$('#fileTitle').html("<h3>" + fname + "</h3>");
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
		//$('#fileTitle').text(decodeURI(urlarg));
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
	location.href="/Downrush.lua";
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
	status_str += x+"\n";
	stat_output.value = status_str;
	stat_output.scrollTop = stat_output.scrollHeight;
}

// Clear Response
function clrRes()
{
	respons_output.innerHTML = "Response";
}

// Set response
function setRes(text)
{
	if(chk.checked)
	{
		respons_output.innerHTML = "<pre>"+text + "</pre>";
	}else{
		respons_output.innerHTML = text ;
	}
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
	if(mode === 'save') {
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
	if(e.data.func == "addStatus")
	{
		addStat(e.data.arg);
	}
	if(e.data.func == "clearResponse")
	{
		clrRes();
	}
	if(e.data.func == "setResponse")
	{
		setRes(e.data.arg);
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

