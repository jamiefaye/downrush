import $ from'jquery';

import React from 'react';
import ReactDOM from "react-dom";

import Clipboard from "./js/clipboard.min.js";
import tippy from "./js/tippy.all.min.js";
import {formatKit} from "./KitList.jsx";
import {getXmlDOMFromString, jsonToXMLString, xmlToJson, jsonToTable} from "./JsonXMLUtils.js";
import {showArranger, colorForGroup, bumpTracks} from "./Arranger.jsx";
import {jsonequals, reviveClass, forceArray, isArrayLike, classReplacer, zonkDNS} from "./JsonXMLUtils.js";

import convertHexTo50 from "./templates/convertHexTo50.js";
import fixm50to50 from "./templates/fixm50to50.js";
import fmtsync from "./templates/fmtsync.js";

import {Kit, Sound, Song, MidiChannel, CVChannel} from "./Classes.jsx";

import note_tip_template from "./templates/note_tip_template.handlebars";

import {gamma_correct, patchInfo, trackKind, yToNoteName, scaleString} from "./SongUtils.js";

import track_head_template from "./templates/track_head_template.handlebars";
import sample_list_template from "./templates/sample_list_template.handlebars";
import param_plot_template from "./templates/param_plot_template.handlebars";
import paster_template from "./templates/paster_template.handlebars";
import midiKnobTemplate from "./templates/midiKnobTemplate.handlebars";
import modKnobTemplate from "./templates/modKnobTemplate.handlebars";
import midiModKnobTemplate from "./templates/midiModKnobTemplate.handlebars";
import sample_range_prefix from "./templates/sample_range_prefix.handlebars";
import sound_template from "./templates/sound_template.handlebars";
import song_template from "./templates/song_template.handlebars";
import simple_track_template from "./templates/simple_track_template.handlebars";

"use strict";

var jQuery = $;
var COLOR_POPUP = false;
var gIdCounter = 0;
var xPlotOffset = 32;
var focusDoc;
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
// Used to cope with y addresses of -32768
function rowYfilter(row) {
	if (row.drumIndex) return Number(row.drumIndex);
	let y = Number(row.y);
	return y;
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
	if (trackA.length === 1) {
		if (typeof trackA[0].noteRows ==='string') {
			song.tracks = [];
			song.instruments = [];
		}
	}
	addTrackToSong(pastedJSON, songDoc);
}

function addTrackToSong(pastedJSON, songDoc) {
	let song = songDoc.jsonDocument.song;

	// If needed, convert the tracks note format
	let clipUsingNewNotes = usesNewNotekFormat(pastedJSON.track);
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
	if (songDoc.version2x) {
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

		VIEW/CONTROLLERS
		
 *******************************************************************************
*/



/*******************************************************************************

		SOUND & MIDI
		
 *******************************************************************************
*/


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
	if ( (context.osc1 && context.osc1.fileName) || (context.osc2 && context.osc2.fileName || (context.osc1 && context.osc1.sampleRanges)) ) {
		let subContext = jQuery.extend(true, {}, context);
		// If Osc2 does not have a sample defined for it, strike osc2 from the context
		if (!context.osc2 || !context.osc2.sampleRanges && (!context.osc2.fileName || $.isEmptyObject(context.osc2.fileName))) {
			delete subContext.osc2;
		}
		context.stprefix = sample_range_prefix(subContext);
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

function viewSound(e, songJ) {
	let target = e.target;
	let trn =  Number(target.getAttribute('trackno'));

	let hideShow = target.textContent;
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	let trackIX = trackA.length - trn - 1;
	let trackD = trackA[trackIX];
	
	// Follow any indirect reference
	if (trackD.instrument && trackD.instrument.referToTrackId !== undefined) {
		let fromID = Number(trackD.instrument.referToTrackId);
		trackD = trackA[fromID];
	}

	// find head div, then place to put
	let headdiv = $(target).closest('.trackhd');
	let where = $('.sndplc', headdiv);

	if (hideShow === "▼") {
		target.textContent = "►";
		ReactDOM.unmountComponentAtNode($(where)[0]);
		$(where)[0].innerHTML = "";
	} else {
		let trackType = trackKind(trackD);
		if (trackType === 'sound' || trackType === 'kit'|| trackType === 'midi') {
			target.textContent = "▼";
		} else {
			return;
		}
		if (trackType === 'sound') {
		let soundD = findSoundData(trackD, songJ);
		formatSound(where, soundD, trackD.soundParams);
	  } else if (trackType === 'kit') {
			// We have a kit track,, 
			let kitroot = trackD.kit;
			if (trackD['soundSources']) {
				kitroot = trackD.soundSources.sound;
			} else {
				kitroot = findKitList(trackD, songJ);
			}

			if(kitroot) {
				formatKit(kitroot, trackD.kitParams, where[0]);
			}
		} else if(trackType === 'midi') {
			formatMidi(where, trackD);
		}
	 }
}


/*******************************************************************************

		TRACK

 *******************************************************************************
*/

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
	if (!reftrack.kit.soundSources) {
		let meow = 2;
	}
	let kitList = forceArray(reftrack.kit.soundSources);
	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});
	if (kitList) {
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
	}
	obj.append(parentDiv);
}

function findKitInstrument(track, list) {
	let pSlot = track.instrumentPresetSlot;
	let pSubSlot = track.instrumentPresetSubSlot;
	let items = forceArray(list);
	if (items) {
		for(let k of items) {
			if (k instanceof Kit) {
				if (k.presetSlot === pSlot && k.presetSubSlot === pSubSlot) return k;
			}
		}
	}
	return undefined;
}

function findSoundInstrument(track, list) {
	let pSlot = track.instrumentPresetSlot;
	let pSubSlot = track.instrumentPresetSubSlot;
	let items = forceArray(list);
	if (items) {
		for(let k of items) {
			if (k instanceof Sound) {
				if (k.presetSlot === pSlot && k.presetSubSlot === pSubSlot) return k;
			}
		}
	}
	return undefined;
}

function findCVInstrument(track, list) {
	let pChan = track.cvChannel;
	let items = forceArray(list);
	if (items) {
		for(let k of items) {
			if (k instanceof CVChannel) {
				if (k.channel === pChan) return k;
			}
		}
	}
	return undefined;
}

function findMidiInstrument(track, list) {
	let pChan = track.midiChannel;
	let items = forceArray(list);
	if (items) {
		for(let k of items) {
			if (k instanceof MidiChannel) {
				if (k.channel === pChan) return k;
			}
		}
	}
	return undefined;
}


function findKitList(track, song) {
	let kitList;
	if (track.kit) {
		kitList = forceArray(track.kit.soundSources);
	} else {
		let kitI = findKitInstrument(track, song.instruments);
		if(!kitI) {
			console.log("Missing kit instrument");
			return;
		}
		kitList = forceArray(kitI.soundSources);
	}
	return kitList;
}

function findSoundData(track, song) {
	let soundData;
	if (track.sound) {
		soundData = track.sound;
	} else {
		soundData = findSoundInstrument(track, song.instruments);
		if(!soundData) {
			console.log("Missing sound data");
		}
	}
	return soundData;
}

function plotKit14(track, reftrack, song, obj) {
	let kitItemH = 8;
	let trackW = Number(track.trackLength);
// first walk the track and find min and max y positions
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	if (rowList.length === 0) return;
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
	let kitList = findKitList(reftrack, song);

	parentDiv.css({height: totH + 'px', width: (trackW + xPlotOffset) + 'px'});
	if (kitList) {
		for (var rx = 0; rx < rowList.length; ++rx) {
			let row = rowList[rx];
			var noteData = row.noteData;
			let labName = '';
			let y = rowYfilter(row);
			let ypos = (y- ymin) * kitItemH;
	
			if (row.drumIndex) {
				let rowInfo = kitList[row.drumIndex];
				labName = rowInfo.name;
				if (rowInfo.channel) {
					let chanNum = Number(rowInfo.channel);
					if (rowInfo.note) { // Midi
						labName = (chanNum + 1) + "." + rowInfo.note;
					} else { // CV
						labName = "Gate " + chanNum;
					}
				}
				if (labName != undefined) {
					let labdiv = $("<div class='kitlab'/>");
					labdiv.text(labName);
					labdiv.css({left: 0, bottom: (ypos - 2) + 'px'});
					parentDiv.append(labdiv);
				}
			}
			if (y < 0) continue;
			if (noteData) {
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
		}
	}
	obj.append(parentDiv);
}


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


function plotTrack14(track, song, obj) {
// first walk the track and find min and max y positions 
	let trackW = Number(track.trackLength);
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	if (rowList.length === 0) return;
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


function activateTippy()
{
	tippy('.npop', {
		arrow: true,
		html: '#npoptemp',
		onShow(pop) {
		// `this` inside callbacks refers to the popper element
			const content = this.querySelector('.tippy-content');
			let text = pop.reference.getAttribute('data-text');
			if (text) {
				content.innerHTML = text;
				return;
			}

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

function usesNewNotekFormat(track) {
	let rowList = forceArray(track.noteRows.noteRow);
	if (rowList.length === 0) return true;
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		if (row.noteData) return true;
		if (row.notes && row.notes.note) return false;
	}
	return false;
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

function plotNoteLevelParams(noteRowA, track, trackW, song, elem)
{
	if (!noteRowA) return;
	let kitList = findKitList(track, song);
	if (!kitList) return;
	noteRowA = forceArray(noteRowA);
	for (var i = 0; i < noteRowA.length; ++i) {
		let aRow = noteRowA[i];
		let aDrum = kitList[aRow.drumIndex];
		
		let prefix = aDrum ? kitList[aRow.drumIndex].name + '.' : '.';
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

function plotParams(track, refTrack, song, elem) {
	let trackType = trackKind(track);
	let trackW = Number(track.trackLength);
	if (track.sound) plotParamLevel("sound.", track.sound, trackW, elem);
	if (track.defaultParams) plotParamLevel("default.", track.defaultParams, trackW, elem);
	if (track.soundParams) plotParamLevel("params.", track.soundParams, trackW, elem);

	if (track.kitParams) {
		plotParamLevel("kit.", track.kitParams, trackW, elem);
		if (track.noteRows) {
			plotNoteLevelParams(track.noteRows.noteRow, refTrack, trackW, song, elem);
		}
	}
	if (trackType == 'midi' && track.modKnobs) {
		plotKnobLevelParams(forceArray(track.modKnobs.modKnob), track, trackW, song, elem);
	}
}


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

function getTrackText(trackNum, songJ)
{
	if (!songJ) return;

	let trackA = forceArray(songJ.tracks.track);
	let trackIX = trackA.length - trackNum - 1;
	let trackJ = trackA[trackIX];
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
	let iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);
	let paster = paster_template({iOSDevice: iOSDevice});
	obj.append($(paster));

	if(iOSDevice) {
		$('.iosSubmit', jDoc.docTopElement).on('click', (e)=>{
			pasteTrackios(e, focusDoc);
		});
	} else {
		$('.paster', jDoc.docTopElement).on('paste', (e)=>{
			pasteTrack(e, focusDoc);
		});
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
	for (let k in json) {
		if(json.hasOwnProperty(k)) {
			let v = json[k];
			if (k === 'fileName' && typeof v === "string") {
				sampMap.add(v);
			} else
			if (isArrayLike(v)) {
				for(var ix = 0; ix < v.length; ++ix) {
					let aobj = v[ix];
					if (isArrayLike(aobj) || aobj instanceof Object) {
						scanSamples(v[ix], sampMap);
					}
				}
			} else if(v instanceof Object) {
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

function genSampleReport(jsong,jdoc)
{
	let isChecked = $(".showdrums", jdoc).is(':checked');
	$('.samprepplace table', jdoc).remove();
	sampleReport(jsong, isChecked, $('.samprepplace', jdoc));
	$('.showdrums').on('click', function () {
		genSampleReport(jsong, jdoc);
	});
}

function formatSong(jdoc, obj) {
	let jsong = jdoc.jsonDocument.song;
	let newNoteFormat = jdoc.newNoteFormat;
	let ctab = genColorTab(jsong.preview);
	obj.append(ctab);
	if (COLOR_POPUP) {
		enableColorPops();
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
			trackHeader(track, jdoc.newSynthNames, i, sectionTab, track_head_template, obj);
			if(tKind === 'kit') {
				
				if(newNoteFormat) {
					plotKit14(track, refTrack, jsong, obj);
				} else {
					plotKit13(track, refTrack, obj);
				}
			} else {
				if(newNoteFormat) {
					plotTrack14(track, jsong, obj);
				} else {
					plotTrack13(track, obj);
				}
			}
			plotParams(track, refTrack, jsong, obj);
		}
		activateTippy();
	  }
	}
	trackPasteField(obj, jdoc);
	songTail(jsong, obj);
	obj.append($("<div class='samprepplace'></div>"));
	genSampleReport(jsong, obj);

	// Populate copy to clip buttons.
	//let clippers = $('.clipbtn', jdoc.docTopElement);
	let clippers = jdoc.docTopElement[0].getElementsByClassName('clipbtn');
	new Clipboard(clippers, {
	   text: function(trigger) {
		let asText = getTrackText(trigger.getAttribute('trackno'), jsong);
		return asText;
	}
	});
	$(".soundviewbtn").on('click', function(e) {
		viewSound(e, jsong);
	});
}

function formatSongSimple(jdoc, obj) {
	let jsong = jdoc.jsonDocument.song;
	let newNoteFormat = jdoc.newNoteFormat;
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

	if(jsong.tracks) {
	  let trax = forceArray(jsong.tracks.track);
	  if (trax) {

		for(var i = 0; i < trax.length; ++i) {
			let track = trax[trax.length - i - 1];
			obj.append($("<table class='simplehead'><tr class=''>"));
			trackHeader(track, jdoc.newSynthNames, i, sectionTab, simple_track_template, obj);
			let ploto = $("<td class='simpleplot'/>");

			let tKind = trackKind(track);
			let refTrack = track;
			if (track.instrument && track.instrument.referToTrackId !== undefined) {
				let fromID = Number(track.instrument.referToTrackId);
				refTrack = trax[fromID];
			}

			if(tKind === 'kit') {
				if(newNoteFormat) {
					plotKit14(track, refTrack, jsong, ploto);
				} else {
					plotKit13(track, refTrack, ploto);
				}
			} else {
				if(newNoteFormat) {
					plotTrack14(track, jsong, ploto);
				} else {
					plotTrack13(track, ploto);
				}
			}
			plotParams(track, refTrack, jsong, ploto);

			obj.append(ploto);
			obj.append($("</tr></table>"));
		}
		activateTippy();
	  }
	}
	// trackPasteField(obj, jdoc);
}

/*******************************************************************************

		Top Level

 *******************************************************************************
*/

class DelugeDoc {
  constructor(fname, text, newKitFlag, simple) {
  	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.fname = fname;
	this.simple = simple;
	let songhead = song_template({idsuffix: this.idString});
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
	var asJSON = xmlToJson(asDOM);
	if (newKitFlag) {
		asJSON.kit.soundSources = [];
	}
	this.jsonDocument = asJSON;
	let jtabid = this.idFor('jtab');
	$(jtabid).empty();
	this.jsonToTopTable(this, $(jtabid), simple);
  }

  idFor(root) {
	return '#' + root + this.idString;
  }

	
// Trigger redraw of displayed object(s).
  triggerRedraw() {
  	let jtabid = this.idFor('jtab');
	$(jtabid).empty();
	this.jsonToTopTable(this, $(jtabid), this.simple);
}

  jsonToTopTable(jdoc, obj, simple)
{
	$(this.idFor('fileTitle')).html(this.fname);
	let json = jdoc.jsonDocument;
	if(json['song']) {
		if (simple) {
			formatSongSimple(jdoc, obj);
		} else {
			formatSong(jdoc, obj);
		}
	} else if(json['sound']) {
		formatSound(obj, json.sound, json.sound.defaultParams, json.sound.soundParams);
	} else if(json['kit']) {
		let wherePut = $(this.idFor('jtab'))[0];
		let kitList = json.kit.soundSources;
		formatKit(kitList, json.kitParams, wherePut);
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

};



function setFocusDoc(toDoc) {
	focusDoc = toDoc;
}

function getFocusDoc() {
	return focusDoc;
}

function makeDelugeDoc(fname, text, newKitFlag, simple)
{
	return new DelugeDoc(fname, text, newKitFlag, simple);
}

export {formatSong, formatSound, makeDelugeDoc, setFocusDoc, getFocusDoc, pasteTrackJson};