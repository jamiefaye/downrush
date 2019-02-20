import {patchNames, kitNames, newSynthPatchNames} from "./js/delugepatches.js";

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



export {gamma_correct, patchInfo, trackKind};