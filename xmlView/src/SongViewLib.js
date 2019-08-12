import $ from'jquery';

import React from 'react';
import ReactDOM from "react-dom";

import Clipboard from "./js/clipboard.min.js";
import tippy from "./js/tippy.all.min.js";
import {formatKit} from "./KitList.jsx";
import {getXmlDOMFromString, jsonToXMLString, xmlToJson, xml3ToJson, jsonToTable} from "./JsonXMLUtils.js";
import {showArranger, colorForGroup, bumpTracks} from "./Arranger.jsx";
import {jsonequals, reviveClass, forceArray, getClipArray, classReplacer, zonkDNS} from "./JsonXMLUtils.js";
import {fixm50to50, fmtsync} from './FmtSound.js';;
import {Kit, Sound, Song, MidiChannel, CVChannel} from "./Classes.jsx";
import {gamma_correct, patchInfo, trackKind, yToNoteName, scaleString} from "./SongUtils.js";
import {song_template} from "./templates.js";
import {SoundTab} from './SoundTab.jsx';
import {SampleList} from './SampleList.jsx';

import {placeTrack, activateTippy, findKitList, findKitInstrument, findSoundInstrument, findMidiInstrument, findCVInstrument, usesNewNoteFormat, encodeNoteInfo, findSoundData} from "./TrackView.jsx";

"use strict";

var jQuery = $;
var COLOR_POPUP = false;
var gIdCounter = 0;

var focusDoc;

//var trackHeaderTemplate = track_head_template;

/* Plotters
*/

function genColorTab(colors)
{
	let colTab = $("<table class='xmltab'/>");
	for(var y = 0; y < 8; ++y) {
		let colRow = $('<tr/>');
		for(var x = 0; x <18; ++x) {

			let off = (7 - y) * 108 + x * 6;
			let hex = colors.substr(off, 6);
			let hex2 = hex.substr(0,2) + " " + hex.substr(2,2) + " " + hex.substr(4,2);
			//console.log(hex2);
			let td = $("<td class='coltab' data-hex='" + hex2 + "'/>");
			// if (hex !== '000000') console.log("(" + x + ", " + y + " = 0x" + hex);
			td.css("background-color", '#' + gamma_correct(hex));
			colRow.append(td);
		}
		colTab.append(colRow);
	}
	return colTab;
}

function enableColorPops() {
		tippy('.coltab', {
		arrow: true,
		html: '#npoptemp',
		onShow(pop) {
			const content = this.querySelector('.tippy-content');
			let colorInfo = pop.reference.getAttribute('style');
			let colhex = pop.reference.getAttribute('data-hex');
			let colstyle = colorInfo.substring(17);
			content.innerHTML = colhex + " " + colorInfo.substring(17);
		//	content.innerHTML = noteInfo;
		},
	});
}

/* 
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

*/

/*
	Demarcation for code to roll-up into objects followimg.
	
*/

/*******************************************************************************

		MODEL MANIPULATION
		
 *******************************************************************************
*/

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

function pasteTrackJson(pastedJSON, songDoc) {
	// If we have a document with one empty track at the front, get rid of it.
	// as this must have been a generated empty document.
	let song = songDoc.jsonDocument.song;
	
	let trackA = forceArray(song.tracks.track);
	song.tracks.track = trackA; // If we forced an array, we want that permanent.

	if (trackA.length === 1) {
		if (typeof trackA[0].noteRows ==='string') {
			song.tracks.track = [];
			song.instruments = [];
		}
	}
	addTrackToSong(pastedJSON, songDoc);
}

function addTrackToSong(pastedJSON, songDoc) {
	let song = songDoc.jsonDocument.song;

	// If needed, convert the tracks note format
	let clipUsingNewNotes = usesNewNoteFormat(pastedJSON.track);
	if (clipUsingNewNotes !== songDoc.newNoteFormat) {
		if (songDoc.newNoteFormat) {
			console.log('converting old note format to new');
			oldToNewNotes(pastedJSON.track);
		} else {
			console.log('converting new note format to old');
			newToOldNotes(pastedJSON.track);
		}
	}

	// Place the new track at the beginning of the track array
	let trackA = forceArray(song.tracks.track);
	song.tracks.track = trackA; // If we forced an array, we want that permanent.
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
	
	let track0 = trackA[0];
	if (songDoc.version2x || songDoc.version3Format) {
		song.instruments = forceArray(song.instruments);
		// Check if we need to add the sound, kit, midiChannel, or cvChannel to the instruments list.
		let tKind = trackKind(track0);
		if (tKind === 'kit') {
			let ko = findKitInstrument(track0, song.instruments);
			if (!ko) {
				delete track0.kit.trackInstances;
				song.instruments.unshift(track0.kit);
			}
			delete track0.kit;
		} else if (tKind === 'sound') {
			let so = findSoundInstrument(track0, song.instruments);
			if (!so) {
				delete track0.sound.trackInstances;
				song.instruments.unshift(track0.sound);
			}
			delete track0.sound;
		} else if (tKind === 'midi') {
			let mi = findMidiInstrument(track0, song.instruments);
			if (!mi) {
				let mo = new MidiChannel();
				mo.channel = track0.midiChannel;
				mo.suffix = -1;
				song.instruments.unshift(mo);
			}
		} else if (tKind === 'cv') {
			let ci = findCVInstrument(track0, song.instruments);
			if (!ci) {
				let co = new CVChannel();
				co.channel = track0.cvChannel;
				song.instruments.unshift(co);
			}
		} else if (tKind === 'audio') {
			// Someday handle paste here.
			
		}
		// Iterate thru the song-level instruments element if it exists, fixing the track numbers.
		for (let inst in song.instruments) {
			bumpTracks(song.instruments[inst]);
		}
	} else {
		// If we are editing pre 2.x songs:
		// Now we try and element duplicate sound or kit elements
		// Since our new item was inserted at the front of the list, we search the remmaining tracks
		// for those that are equal to our element. We then replace their sound or kit with a referToTrackId of 0

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
	}
	songDoc.triggerRedraw();
}


function pasteTrackText(text, songDoc) {
	if (!songDoc.jsonDocument) return;
	let song = songDoc.jsonDocument.song;
	let pastedJSON = JSON.parse(text, reviveClass);

	if (!pastedJSON || !pastedJSON.track) {
		alert("Invalid data on clipboard.");
		return;
	}

	addTrackToSong(pastedJSON, songDoc);
	
}


/*******************************************************************************

		SOUND & MIDI
		
 *******************************************************************************
*/


function formatSound(obj) {
	let context = {};
	for (var i = 1; i < arguments.length; ++i) {
		if(arguments[i]) {
			jQuery.extend(true, context, arguments[i]);
		}
	}

	// let sndt = new SoundTab({sound: context});
	let sndt = React.createElement(SoundTab, {sound: context});
	ReactDOM.render(sndt, obj[0]);
}


/*******************************************************************************

		TRACK

 *******************************************************************************
*/

function trackHeader(track, newSynthNames, inx, repeatTab, template, obj) {
	let context = patchInfo(track, newSynthNames);
	let section = Number(track.section);
	let sectionColor = colorForGroup(section);
	let repeats = Number(repeatTab[section].numRepeats);
	if (repeats === 0) repeats = '&#x221e;';
	 else if (repeats === -1) repeats = 'Share';
	
	let addedContext = {...context,
		sectionColor:	sectionColor,
		colourOffset: 	track.colourOffset,
		section: 		section,
		repeats:		repeats,
		trackNum:		inx + 1,
		trackIndex:		inx,
	}

	let trtab = template(addedContext);
	obj.append(trtab);
}

function getTrackTextNum(trackNum, songJ)
{
	if (!songJ) return;

	let trackA = getClipArray(songJ);
	let trackIX = trackA.length - trackNum - 1;
	let trackJ = trackA[trackIX];
	return getTrackText(trackJ, songJ);
}

function getTrackText(trackJ, songJ)
{
	if (!songJ) return;

	// Dereference referToTrackId if needed.
	let	trackD = {...trackJ}; // working copy
	if (trackJ.instrument && trackJ.instrument.referToTrackId !== undefined) {
		let fromID = Number(trackJ.instrument.referToTrackId);
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
	}
	// If we are a kit track, and we don't have a kit element, see if the song-level 
	// instruments element is available. If so, borrow from that.
	let tkind = trackKind(trackD);
	if (tkind === 'kit') {
		if (!trackD["kit"]) {
			let kitI = findKitInstrument(trackD, songJ.instruments);
			if(!kitI) {
				console.log("Missing kit instrument");
			} else {
				let kd = new Kit(kitI);
				delete kd.trackInstances;
				trackD['kit'] = kd;
				
			}
		}
	} else if (tkind === 'sound') {
		if (!trackD["sound"]) {
			let soundI = findSoundInstrument(trackD, songJ.instruments);
			if(!soundI) {
				console.log("Missing sound instrument");
			} else {
				let sd = new Sound(soundI);
				delete sd.trackInstances;
				trackD['sound'] = sd;
			}
		}
	}
	zonkDNS(trackD);
	let trackWrap = {"track": trackD};
	let asText = JSON.stringify(trackWrap, classReplacer, 1);
	return asText;
}

/*******************************************************************************

		SONG

 *******************************************************************************
*/

function pasteTrackios(e, jDoc) {
	
	let pasteel = $(".paster", jDoc.docTopElement);
	if(pasteel && pasteel.length > 0) {
		let t = pasteel[0].value;
		pasteTrackText(t, jDoc);
	}
}

function pasteTrack(e, jDoc) {
	let clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData;

	let pastedData = clipboardData.getData('text');
		// Clear the pasted-into-area
	setTimeout( function() {
		let ta =$(".paster", jDoc.docTopElement)[0];
		ta.value = ta.defaultValue;
	}, 200);
	pasteTrackText(pastedData, jDoc);
}

function trackPasteField(obj, jDoc) {
	obj.append($("<hr><div><b>Paste track data in field below to add it to song.</b><br><textarea class='paster tinybox' rows='2'></textarea></div>"));
	$('.paster', jDoc.docTopElement).on('paste', (e)=>{
		pasteTrack(e, focusDoc);
	});
}

/*
function songTail(jsong, obj) {
	formatSound(obj, jsong, jsong.songParams, jsong.defaultParams, jsong.soundParams);
}
*/

// Return song tempo calculated from timePerTimerTick and timerTickFraction
function convertTempo(jsong)
{
	let fractPart = (jsong.timerTickFraction>>>0) / 0x100000000;
	let realTPT = Number(jsong.timePerTimerTick) + fractPart;
	// Timer tick math: 44100 = standard Fs; 48 = PPQN;
	// tempo = (44100 * 60) / 48 * realTPT;
	// tempo = 55125 / realTPT
	// rounded to 1 place after decimal point:
	let tempo = Math.round(551250 / realTPT) / 10;

	// console.log("timePerTimerTick=" + jsong.timePerTimerTick + " realTPT= " +  realTPT + " tempo= " + tempo);
	// console.log("timerTickFraction=" + jsong.timerTickFraction + " fractPart= " +  fractPart);
	return tempo;
}

function genSampleReport(jsong, jdoc)
{
	let sndt = React.createElement(SampleList, {samplePath: '/', song: jsong});
	ReactDOM.render(sndt, $('.samprepplace', jdoc)[0]);
/*
	let isChecked = $(".showdrums", jdoc).is(':checked');
	$('.samprepplace table', jdoc).remove();
	sampleReport(jsong, isChecked, $('.samprepplace', jdoc));
	$('.showdrums').on('click', function () {
		genSampleReport(jsong, jdoc);
	});
*/
}



/*******************************************************************************

		Top Level

 *******************************************************************************
*/

class DelugeDoc {
  constructor(fname, text, options) {
  	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.fname = fname;
	let temp1 = song_template.split('{{idsuffix}}');
	let songhead = temp1.join(this.idString);
	this.options = options;
	// docspot
	$('#docspot').empty();
	$('#docspot').append(songhead);
	this.docTopElement = $(this.idFor('docId'));

	// Capture the current firmware version and then remove that from the string.
	let firmHits = /<firmwareVersion>.*<.firmwareVersion>/i.exec(text);
	if (firmHits && firmHits.length > 0) {
		this.firmwareVersionFound = firmHits[0];
	} else {
		this.firmwareVersionFound='';
	}

	// Also look for the  earliestCompatibleFirmware element.
	let earliestHits = /<earliestCompatibleFirmware>.*<.earliestCompatibleFirmware>/i.exec(text);
	if (earliestHits && earliestHits.length > 0) {
		this.earliestCompatibleFirmware = earliestHits[0];
	} else {
		this.earliestCompatibleFirmware='';
	}

//	let str = this.firmwareVersionFound + "\n" + this.earliestCompatibleFirmware + "\n";
//	alert(str);

	this.newNoteFormat = !(this.firmwareVersionFound.indexOf('1.2.') >= 0 || this.firmwareVersionFound.indexOf('1.3.') >= 0);
	this.version3Format = text.indexOf('earliestCompatibleFirmware="3') > 0;
	this.version2x = this.firmwareVersionFound.indexOf('>2.') >= 0;
	this.newSynthNames = !!this.earliestCompatibleFirmware;
	
	// Skip past the illegal elements at the front of the file
	// We stop when we see a <k or a <s
	let inx = 0;
	let eofx = text.length - 1;
	while (inx < eofx) {
		if (text[inx] === '<') {
			let c = text[inx + 1];
			if (c === 's' || c === 'k') break;
		}
		inx++;
	}
	let fixedText = '<?xml version="1.0" encoding="UTF-8"?>\n' + text.substring(inx);

//	let firstFixed = fixedText.substring(0, 160);
//	alert (firstFixed);

	var asDOM = getXmlDOMFromString(fixedText);
	// Uncomment following to generate ordering table based on a real-world example.
	// enOrderTab(asDOM);
	var asJSON = this.version3Format ? xml3ToJson(asDOM) : xmlToJson(asDOM);
	if (options.newKit) {
		asJSON.kit.soundSources = [];
	}
	this.jsonDocument = asJSON;
	let jtabid = this.idFor('jtab');
	$(jtabid).empty();
	this.jsonToTopTable(this, $(jtabid));
  }

  idFor(root) {
	return '#' + root + this.idString;
  }

  formatSongSimple(jdoc, obj) {
	let jsong = jdoc.jsonDocument.song;
	let newNoteFormat = jdoc.newNoteFormat;
	let fullFormat = this.options.viewer !== 'midian';
	if (jsong.preview && fullFormat) {
		let ctab = genColorTab(jsong.preview);
		obj.append(ctab);
	}
	obj.append($("<p class='tinygap'>"));
	obj.append("Tempo = " + convertTempo(jsong) + " bpm");
	let swing = Number(jsong.swingAmount);
	if(swing !== 0) {
		swing += 50;
		let sync = Number(jsong.swingInterval);
		obj.append(", Swing = " + swing + "% on " + fmtsync[sync]);
	}
	
	obj.append(", Key = " + scaleString(jsong));
	obj.append($("<p class='tinygap'>"));
	
	showArranger(jsong, jdoc.newSynthNames, obj);

	obj.append($("<p class='tinygap'>"));

	let sectionTab = forceArray(jsong.sections.section);

	if(jsong.tracks || jsong.sessionClips) {
	  let trax = getClipArray(jsong);
	  if (trax) {
		for(var i = 0; i < trax.length; ++i) {
			let track = trax[trax.length - i - 1];
			placeTrack(obj, track, i,  jsong, this.options);
		}
		activateTippy();
	  }
	}

	// Don't allow track pasting in version 3 yet.
	if (fullFormat && !jdoc.version3Format) {
		trackPasteField(obj, jdoc);
		obj.append($("<div class='samprepplace'></div>"));
		genSampleReport(jsong, obj);
	}
}


	
// Trigger redraw of displayed object(s).
  triggerRedraw() {
  	let jtabid = this.idFor('jtab');
	$(jtabid).empty();
	this.jsonToTopTable(this, $(jtabid));
}

  jsonToTopTable(jdoc, obj)
{
	$(this.idFor('fileTitle')).html(this.fname);
	let json = jdoc.jsonDocument;
	if(json['song']) {
		this.formatSongSimple(jdoc, obj);
	} else if(json['sound']) {
		formatSound(obj, json.sound, json.sound.defaultParams, json.sound.soundParams);
	} else if(json['kit']) {
		let wherePut = $(this.idFor('jtab'))[0];
		let kitList = json.kit.soundSources;
		formatKit(kitList, wherePut);
	} else {
		jsonToTable(json, obj);
	}
}


  saveFile(filepath, data)
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

 genDocXMLString() {
 	if (this.version3Format) {
 		return genDoc3XMLString();
 	}

 	let headerStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
	if (this.firmwareVersionFound) {
		headerStr += this.firmwareVersionFound + "\n";
	}
	if (this.earliestCompatibleFirmware) {
		headerStr += this.earliestCompatibleFirmware + "\n";
	}
	let jsonDoc =  this.jsonDocument
	let toMake;
	if (jsonDoc['song']) toMake = 'song';
	  else if (jsonDoc['sound']) toMake = 'sound';
	   else if (jsonDoc['kit']) toMake = 'kit';
	if (!toMake) return;
 	let saveText = headerStr + jsonToXMLString(toMake, this.jsonDocument[toMake]);
 	return saveText;
 }

 genDoc3XMLString() {
 	let headerStr = '<?xml version="1.0" encoding="UTF-8"?>\n';

	let jsonDoc =  this.jsonDocument
	let toMake;
	if (jsonDoc['song']) toMake = 'song';
	  else if (jsonDoc['sound']) toMake = 'sound';
	   else if (jsonDoc['kit']) toMake = 'kit';
	if (!toMake) return;
 	let saveText = headerStr + jsonToXMLString(toMake, this.jsonDocument[toMake]);
 	return saveText;
 }


 save(toName) {
 	let saveText = this.genDocXMLString();
 	this.fname = toName;
	this.saveFile(toName, saveText);
}

// use ajax to save-back data (instead of a web worker).
  saveFile(filepath, data)
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

}; // End of DelugeDoc class.

function setFocusDoc(toDoc) {
	focusDoc = toDoc;
}

function getFocusDoc() {
	return focusDoc;
}

function makeDelugeDoc(fname, text, options)
{
	return new DelugeDoc(fname, text, options);
}

export {formatSound, makeDelugeDoc, setFocusDoc, getFocusDoc, pasteTrackJson, getTrackText};