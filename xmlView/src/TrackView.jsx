import $ from'jquery';

import React from 'react';
import ReactDOM from "react-dom";
import convertHexTo50 from "./templates/convertHexTo50.js";
import tippy from "./js/tippy.all.min.js";
import {jsonequals, reviveClass, forceArray, isArrayLike, classReplacer, zonkDNS} from "./JsonXMLUtils.js";
import {Kit, Sound, Song, MidiChannel, CVChannel} from "./Classes.jsx";
//import note_tip_template from "./templates/note_tip_template.handlebars";
import {trackKind, yToNoteName, patchInfo, makeScaleTab, noteToYOffsetInScale} from "./SongUtils.js";
import {colorForGroup} from "./Arranger.jsx";
import {KitListView} from './KitList.jsx';
import {WedgeIndicator, CopyToClipButton} from "./GUIstuff.jsx";
import {SoundTab} from './SoundTab.jsx';

//import {FormatMidi} from './FormatTabs.jsx';
import {MidiModKnob} from './MidiModKnob.jsx';

import {getTrackText} from "./SongViewLib.js";


const copy = require('clipboard-copy')

"use strict";

var jQuery = $;

var xPlotOffset = 32;

function encodeNoteInfo(noteName, time, dur, vel, cond)
{
	// Use hack to generate leading zeros.
	let th = (Number(time) + 0x100000000).toString(16).substring(1);
	let dh = (Number(dur) + 0x100000000).toString(16).substring(1);
	let vh = (Number(vel) + 0x100).toString(16).substring(1);
	let ch = (Number(cond) + 0x100).toString(16).substring(1);

	return th + dh + vh + ch + noteName;
}
// Used to cope with y addresses of -32768
function rowYfilter(row) {
	if (row.drumIndex) return Number(row.drumIndex);
	let y = Number(row.y);
	return y;
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


/*******************************************************************************

		TRACK

 *******************************************************************************
*/

function plotKit13(track, reftrack) {
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
	let totW = trackW + xPlotOffset;
	let kitList = forceArray(reftrack.kit.soundSources);
	parentDiv.css({height: totH + 'px', width: totW + 'px'});
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
	return {parentDiv: parentDiv, height: totH, width: totW};
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

function plotKit14(track, reftrack, song) {
	let kitItemH = 8;
	let trackW = Number(track.trackLength);
// first walk the track and find min and max y positions
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);

	let parentDiv = $("<div class='kitgrid'/>");
	if (rowList.length === 0) return {parentDiv: parentDiv, height: 0, width: 0};;
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let totH = ((ymax - ymin) + 1) * kitItemH;
	let totW = trackW + xPlotOffset;
	let kitList = findKitList(reftrack, song);

	parentDiv.css({height: totH + 'px', width: totW + 'px'});
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
	return {parentDiv: parentDiv, height: totH, width: totW};
}


function plotTrack13(track, song) {
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
	let yminS = ymin;
	let ymaxS = ymax;
	let keymap;
	let inKey = Number(track.inKeyMode);
	if (inKey) {
		keymap = makeScaleTab(song);
		yminS = noteToYOffsetInScale(ymin, keymap);
		ymaxS = noteToYOffsetInScale(ymax, keymap);
	}
	let totH = ((ymaxS - yminS) + 2) * 4;
	let totW = trackW + xPlotOffset;
	parentDiv.css({height: totH + 'px', width: totW + 'px'});

	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		let yS = y;
		let labName = yToNoteName(y);
		if (inKey) {
			yS = noteToYOffsetInScale(y, keymap);
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
			let ndiv = $("<div class='trnote npop' data-note='" + noteInfo + "'/>");
			let ypos = (yS- yminS) * 4 + 2;
			ndiv.css({left: dx + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	let miny = totH - 10;
	plotNoteName(ymin, {top: miny + 'px'}, parentDiv);
	if (ymin !== ymax) {
		plotNoteName(ymax, {top: '0px'}, parentDiv);
	}
	return {parentDiv: parentDiv, height: totH, width: totW};
}


function plotTrack14(track, song) {
// first walk the track and find min and max y positions 
	let trackW = Number(track.trackLength);
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='trgrid'/>");
	if (rowList.length === 0) {
		return {parentDiv: parentDiv, height: 0, width: 0};
	}
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}

	let yminS = ymin;
	let ymaxS = ymax;
	let keymap;
	let inKey = Number(track.inKeyMode);
	if (inKey) {
		keymap = makeScaleTab(song);
		yminS = noteToYOffsetInScale(ymin, keymap);
		ymaxS = noteToYOffsetInScale(ymax, keymap);
	}
	let totH = ((ymaxS - yminS) + 2) * 4;
	let totW = trackW + xPlotOffset;

	parentDiv.css({height: totH + 'px', width: totW + 'px'});

	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteData = row.noteData;
		let y = rowYfilter(row);
		if (y < 0) continue;
		let labName = yToNoteName(y);
		let yS = y;
		if (inKey) {
			yS = noteToYOffsetInScale(y, keymap);
		}
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

			let ypos = (yS- yminS) * 4 + 2;
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px', "background-color": colorEncodeNote(vel, cond)});
			parentDiv.append(ndiv);
		}
	}
	let miny = totH - 10;
	plotNoteName(ymin, {top: miny + 'px'}, parentDiv);
	if (ymin !== ymax) {
		plotNoteName(ymax, {top: '0px'}, parentDiv);
	}
	return {parentDiv: parentDiv, height: totH, width: totW};
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
			let noteInfo = notename + " " + vel + " " + durFrac + " " + beatX + " " + condtext;
			/* 
			let noteInfo = note_tip_template({
				notename: notename,
				notevel: vel,
				notedur: durFrac,
				notestart: beatX,
				noteprob: condtext,
			});
			*/
			content.innerHTML = noteInfo;
			},
		onHidden() {
			const content = this.querySelector('.tippy-content')
			content.innerHTML = '';
			},
	});
}

function usesNewNoteFormat(track) {
	let rowList = forceArray(track.noteRows.noteRow);
	if (rowList.length === 0) return true;
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		if (row.noteData) return true;
		if (row.notes && row.notes.note) return false;
	}
	return false;
}

function convertToCCVal(v) {
	// Convert to signed 32 bit.
	if (v & 0x80000000) {
		v -= 0x100000000;
	}
	// Midi CC params range from 0 to 127
	let res = Math.round( (v + 0x80000000) * 127 / 0x100000000);
	return res;
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

function plotMidiParams(track, trackW, elem)
{
	let midiParams = forceArray(track.midiParams.param);
	if (midiParams.length === 0) return;

	for (var i = 0; i < midiParams.length; ++i) {
		let aParam = midiParams[i];
		let v = aParam.value;
		if (typeof v === "string"&& v.startsWith('0x') && v.length >= 10) {
			if (v.length === 10) {
				let asInt= parseInt(v.substring(2, 10), 16);
				let asCCV = convertToCCVal(asInt);
				let ndiv = $("<div class='paramconst'>CC: " + aParam.cc + " = " + asCCV + "</div>");
				ndiv.css({width: (trackW + xPlotOffset) + 'px'});
				elem.append(ndiv);
				continue;
			}
			let prefix = "CC: " + aParam.cc;
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
	
	if (trackType == 'midi' && track.midiParams) {
		plotMidiParams(track, trackW, elem);
	}

	if (trackType == 'midi' && track.modKnobs) {
		plotKnobLevelParams(forceArray(track.modKnobs.modKnob), track, trackW, song, elem);
	}


}



class NotePlot extends React.Component {

  componentDidMount() {

	this.insetX = 6;
	this.scaling = 1;
	this.symbolize();
	this.dragging = false;
	this.dragStart = 0;
	this.start = 0;
	this.end = 0;
	this.duration = 0;
  }

  symbolize() {

	let track = this.props.track;
	let tKind = trackKind(track);
	let jsong = this.props.song;
	let refTrack = track;
	let newNotes = usesNewNoteFormat(track);
	if (track.instrument && track.instrument.referToTrackId !== undefined) {
		let trax = forceArray(jsong.tracks.track);
		let fromID = Number(track.instrument.referToTrackId);
		refTrack = trax[fromID];
	}


	let divInfo;
	if(tKind === 'kit') {
		if(newNotes) {
			divInfo = plotKit14(track, refTrack, jsong);
		} else {
			divInfo = plotKit13(track, refTrack);
		}
	} else {
		if(newNotes) {
			divInfo = plotTrack14(track, jsong);
		} else {
			divInfo = plotTrack13(track, jsong);
		}
	}
	let {parentDiv, width, height} = divInfo;

	this.selection = $("<div class='selbox'/>");
	parentDiv.append(this.selection);
	$(this.el).append(parentDiv);
	plotParams(track, refTrack, this.props.song, $(this.el));

	this.height = height;
  }

  changeSel(t0, t1) {
	let startX = this.timeToX(t0);
	let endX = this.timeToX(t1);
	this.start = t0;
	this.end = t1;
	
	if (this.props.notifier) {
		this.props.notifier(t0, t1);
	}

//	console.log("start: " + startX + " end: " + endX);
	this.selection.css({left: startX + 'px', width: (endX - startX) + 'px', top: 0 + 'px', height: this.height + 'px' });
  }

  timeToX(t) {

	let x = Math.round(t * this.scaling) + this.insetX;
	//if (x < 0) x = 0;
	//if (x > this.highW) x = this.highW;
	return x;
  }

  xToTime(xr) {

	let xt = (xr - this.insetX) / this.scaling;
	//if (xt < 0) xt = 0;
	//if (xt > this.duration) xt = this.duration;
	return xt;
  }

  render() {
	return <div ref={el => this.el = el}> </div>
  }

  bounds() {
  	return this.el.getBoundingClientRect();
  }

  getSelection() {
  	let firstTime = this.props.converter.lowTime;
  	return {
		start: this.start + firstTime,
		end:   this.end + firstTime
	}
  }
}



class NoteGrid extends React.Component {
  constructor(props) {
  	super(props);
  }

  render() {
  	return <div onMouseDown={(e)=>{this.begin_drag(e)}}>
		<NotePlot ref={el => this.plot = el} track={this.props.track} song={this.props.song} notifier={this.props.notifier} />
  		</div>
  }

  begin_drag(e) {
	var dragActive;
	var t0;
	var t1;
	var me = this;
	var clientRect = me.plot.bounds();

	var rangeUpdater = function(e) {
		let x = e.clientX - clientRect.left;
		t1 = me.plot.xToTime(x);
		let tS = t0;
		let tE = t1;
		if (t1 < t0) {
			tS = t1;
			tE = t0;
		}
		me.plot.changeSel(tS, tE);
	}

	var eventMove = function (e) {
		if (!dragActive) return;
		rangeUpdater(e);
	}

	var eventUp = function (e) {
		dragActive = false;
		if (t0 === t1) {
			me.plot.changeSel(0,0)
		}
		let win = $(window);
		win.off('mousemove', eventMove);
		win.off('touchmove', eventMove);
		win.off('mouseup', eventUp);
		win.off('touchend', eventUp);
	}

	var eventDown = function (e) {
		let x = e.clientX - clientRect.left;
		t0 = me.plot.xToTime(x);
		t1 = t0;

		dragActive = true;

		let win = $(window);
		win.on('mousemove', eventMove); // dynamic listeners
		win.on('touchmove', eventMove);
		win.on('mouseup', eventUp);
		win.on('touchend', eventUp);
	}

	eventDown(e);
  }

  getSelectedTimes() {
	return this.plot.getSelection();
  }
}

 class TrackView extends React.Component {
    constructor(context) {
      	super(context);
		this.context = context;
		this.jqElem = context.jqElem;
  	}

 	render() {
 		let props = this.props;
 		let track = props.track;
 		return <NoteGrid track={track} song={props.song} />
 	}
 }

 class TrackObj {
   constructor(context) {
		this.context = context;
		this.jqElem = context.jqElem;
  	}

	render() {
		let jqElem = this.jqElem;
		this.trackObj = React.createElement(TrackView, this.context);
		ReactDOM.render(this.trackObj, jqElem);
	}

} // End class

function placeTrackObj(where, trackJ, song) {
	
	let context = {};
	// React wants to be given a DOM object to replace, so we make one up
	where.append("<div/>");
	let obj = where[0].lastChild
	context.jqElem = obj
	context.track = trackJ;
	context.song = song;
	let trackObj = new TrackObj(context);
	trackObj.render();
	return trackObj;
}

// **********************************************************************

class TinyButton extends React.Component {
  constructor(props) {
	super(props);
		this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
	//	this.buttonEl.blur();
		this.props.click(e);
  }

  render() {
	return (
		<button className='tinybutn' title={this.props.title} ref={(el) => { this.buttonEl = el}}>
			<div onClick={this.handleClick} >{this.props.title}</div>
		</button>);
	}
}


class SimpleTrackHeader extends React.Component {

	render() {
		let props = this.props;
		let fullHeader = props.options.viewer !== 'midian';
		let track = props.track;
		let trackNum = props.trackNum;
		let section = Number(track.section);
		let sectionColor = colorForGroup(section);
		let info = patchInfo(track, true);
		let popText = info.kindName + " " + info.patch;
		let clipboardEnabled = fullHeader;
		let toMidiEnabled = props.transTrig;
		if (info.patchName) popText += " (" +  info.patchName + ")";
		if (info.info) popText += " " + info.info;
		return (<td className='simplechan npop' style={{backgroundColor: sectionColor}} data-text={popText}>
			<b>{trackNum + 1}</b><span className="simplepatch">:{info.patch}</span>
			{toMidiEnabled? <TinyButton title='+ Midi' click = {props.transTrig}/> : null}
			{clipboardEnabled ? <TinyButton title='&rarr; Clip' click={props.copySel} /> : null} 
			{fullHeader ? <WedgeIndicator opened={this.props.showTab} toggler={props.toggleTab} /> : null}
		</td>)
	}
}

class SoundDetails extends React.Component {

 	render() {
 		let track = this.props.track;
 		let trackType = trackKind(track);
 		if (trackType === 'sound') {
 			let soundData = findSoundData(track, this.props.song);
 			return 	<SoundTab sound={soundData} />;
 		} else if (trackType === 'kit') {
			let kitroot = track.kit;
			if (track['soundSources']) {
				kitroot = track.soundSources.sound;
			} else {
				kitroot = findKitList(track, this.props.song);
			}
 			return <KitListView kitList={kitroot} />;
 		} else if (trackType === 'midi') {
 			return <MidiModKnob sound={track} />;
 		}
 	}
}


 class NewTrackView extends React.Component {
    constructor(context) {
		super(context);
		
		this.selt0 = 0;
		this.selt1 = 0;
		this.state = {showTab: false};
		this.toggleTab = this.toggleTab.bind(this);
		this.copySel = this.copySel.bind(this);
		this.transTrig = this.transTrig.bind(this);
	}

 	render() {
		let props = this.props;
		let track = props.track;
		let state = this.state;
		let trigFunc = props.options.transTrack ? this.transTrig : undefined;
 		return (
 	  <div>
 		<table className='simplehead'><tbody><tr>
 			<SimpleTrackHeader track={track} trackNum={props.trackNum} song={props.song} showTab={state.showTab}
 				copySel={this.copySel} toggleTab={this.toggleTab} transTrig = {trigFunc} options = {props.options}/>
			<td><NoteGrid track={track} song={props.song} notifier={(t0, t1)=>{
				this.selt0 = t0;
				this.selt1 = t1;
			}} /></td>
			</tr>
			</tbody>
		</table>
		{state.showTab ? <tr><SoundDetails track={track} song={props.song} /></tr> : null}
	  </div>)
 	}

  toggleTab() {
	this.setState({showTab: !this.state.showTab});
  }

  copySel() {
	let props = this.props;
	let trackText = getTrackText(props.track, props.song);
	copy(trackText);
  }

  transTrig(e) {
	let props = this.props;
 	props.options.transTrack(props.song, props.trackNum, this.selt0, this.selt1);
  }
 }


class NewTrackObj {
   constructor(context) {
		this.context = context;
		this.jqElem = context.jqElem;
  	}

	render() {
		let jqElem = this.jqElem;
		this.trackObj = React.createElement(NewTrackView, this.context);
		ReactDOM.render(this.trackObj, jqElem);
	}

} // End class

function placeTrack(where, trackJ, trackNum, song, options) {
	
	let context = {};
	// React wants to be given a DOM object to replace, so we make one up
	where.append("<div/>");
	let obj = where[0].lastChild
	context.jqElem = obj
	context.track = trackJ;
	context.song = song;
	context.trackNum = trackNum;
	context.options = options;
	let trackObj = new NewTrackObj(context);
	trackObj.render();
	return trackObj;
}


export {placeTrackObj, placeTrack, activateTippy, findKitList, findKitInstrument, findSoundInstrument, usesNewNoteFormat, encodeNoteInfo, findSoundData, findMidiInstrument}