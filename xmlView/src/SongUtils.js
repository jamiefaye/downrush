import {patchNames, kitNames, newSynthPatchNames} from "./js/delugepatches.js";
import {jsonequals} from "./JsonXMLUtils.js";

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


var trackKindNames = {"kit": "Kit",
					"sound": "Synth",
					"midi": "Midi",
					"cv": "CV",
					"unknown": "?",
					};


function trackKind(track) {
	if(track['kit'] !== undefined) return 'kit';
	if(track['sound'] !== undefined) return 'sound';
	if(track['midiChannel'] !== undefined) return 'midi';
	if(track['cvChannel'] !== undefined) return 'cv';
	// deal with indirect refs
	if(track['kitParams'] !== undefined) return 'kit';
	if(track['soundParams'] !== undefined) return 'sound';
	return 'unknown';
}


function patchInfo(track, newSynthNames) {

	let patchStr = "";
	let kind = trackKind(track);
	let patch = Number(track.instrumentPresetSlot);

	if (kind === 'kit' || kind === 'sound') {
		patchStr = patch;
		let subpatch = Number(track.instrumentPresetSubSlot);
		if (track.instrumentPresetSubSlot !== undefined && subpatch >= 0) {
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
		patchName = newSynthNames ? newSynthPatchNames[patch] : patchNames[patch];
	} else if (kind === 'cv') {
		patchStr = Number(track.cvChannel) + 1;
		patchName = '';
	}

	return {
		len:			track.trackLength,
		patch: 			patchStr,
		patchName:		patchName,
		kindName: 		trackKindNames[kind],
		info:			info,
	};
}

var noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert Midi note number into note name + octave, with 0 meaning C minus 2
function yToNoteName(note)
{
	let oct = Math.round(note / 12) - 2;
	let tone = note % 12;
	return noteNames[tone] + oct;
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

function makeScaleTab(jsong) {
	let modeTab = jsong.modeNotes.modeNote;
	let root = Number(jsong.rootNote) % 12;
	let chromeToScaleTab = [];

	let ctx = 0;
	let scaleVal = 0;
	let prevMNote = Number(modeTab[0]);
	for (let i = 0; i < 7; ++i) {
		let nextModeNote;
		if (i == 6) {nextModeNote = 12} else {nextModeNote = Number(modeTab[i + 1])};
		let deltaModeNote = nextModeNote - prevMNote;
		prevMNote = nextModeNote;
		chromeToScaleTab[ctx++] = scaleVal;
		if (deltaModeNote === 2) chromeToScaleTab[ctx++] = scaleVal + 0.5;
		scaleVal++;
	}
	chromeToScaleTab.rootNote = root;
	return chromeToScaleTab;
}


function noteToYOffsetInScale(n, chromeToScaleTab) {
	let root = chromeToScaleTab.rootNote;
	let oct = (n - root) / 12;
	let noff = (n - root) % 12;
	let yoff = chromeToScaleTab[noff] + oct * 7;
	return yoff;
}


export {gamma_correct, patchInfo, trackKind, yToNoteName, scaleString, makeScaleTab, noteToYOffsetInScale};