import {Midi} from "./Midi/Midi.js";
import {Note} from "./Midi/Note.js";
import {Track} from "./Midi/Track.js";

var delugePPQ = 48;

function isArrayLike(val) {
    if (val === null) { return false;}
    if (Array.isArray(val)) return true;
//    if (isObservableArray(val)) return true;
    return false;
}

function forceArray(obj) {
	if(obj !== undefined && isArrayLike(obj)) return obj;
	let aObj = [];
	if(obj === undefined) return aObj;
	aObj[0] = obj;
	return aObj;
}

// Used to cope with y addresses of -32768
function rowYfilter(row) {
	if (row.drumIndex) return Number(row.drumIndex);
	var y = Number(row.y);
	return y;
}

function clipNote(midi, ticks, velocity, dur, channel, timeoff, clipS, clipE, head) {
	let tS = ticks;
	let tE = ticks + dur;

	let ppq = head.ppq;
	console.log("PPQ: " + ppq);
	if (clipS < clipE) {
		if (tS < clipS) tS = clipS;
		if (tE > clipE) tE = clipE;
		if (tS >= tE) return undefined;
	}
	let tX = Math.round((tS + timeoff) * head.ppq / delugePPQ);
	let tOff = Math.round((tE + timeoff) * head.ppq / delugePPQ);
	console.log("ticks: " + ticks + " ts: " + tS + " tx: " + tX + " toff: " + tOff);
	
	let note = new Note({midi: midi, ticks: tX, velocity: velocity, channel: channel},{ticks: tOff, velocity: 0, channel: channel}, head);
	return note;
}

function clipNoteN(y, t, vel, dur, chan, timeoff, clipS, clipE, head) {
	
	let ppq = head.ppq;
	let onTimeC = Math.round(t * ppq / delugePPQ);
	let scaledDur = Math.round(dur * ppq / delugePPQ);
	let offTimeC = onTimeC + scaledDur;
	let note = new Note({midi: y, ticks: onTimeC, velocity: vel, channel: chan},{ticks: offTimeC, velocity: 0, channel: chan}, head);

	return note;
}


// Encode a particular Deluge track as a Midi sequence
function encodeAsMidi14(track, start, len, chan, timeoff, clipS, clipE, head) {
	let endT = start + len;
	let midiOut = [];
	let baseT = start;
	console.log("Midi13 timeoff: " + timeoff + " baseT: " + baseT);
	let trackLen = Number(track.trackLength);
	if (!trackLen) return [];
	while (baseT < endT) {
		let rowList = forceArray(track.noteRows.noteRow);
		for (var rx = 0; rx < rowList.length; ++rx) {
			let row = rowList[rx];
			var noteData = row.noteData;
			let y = rowYfilter(row);
			if (y < 0) continue;
			for (var nx = 2; nx < noteData.length; nx += 20) {
				let notehex = noteData.substring(nx, nx + 20);
				let x = parseInt(notehex.substring(0, 8), 16);
				let dur =  parseInt(notehex.substring(8, 16), 16);
				let vel = parseInt(notehex.substring(16, 18), 16);
//				let cond = parseInt(notehex.substring(18, 20), 16);

				let velN = vel / 127;
				let note = clipNote(y, x + baseT, velN, dur, chan, timeoff, clipS, clipE, head);
				if (note) {
					midiOut.push(note);
				}
			}
		}
		baseT+= trackLen;
		//timeoff += trackLen;
	}
	midiOut.sort((a,b)=>{ return a.ticks - b.ticks});

	return midiOut;
}

/*

// Encode a particular Deluge track as a Midi sequence
function encodeAsMidi14Old(track, start, len, chan, timeoff, clipS, clipE, head) {
	let midiPPQ = head.ppq;
	let endT = start + len;
	let midiOut = [];
	let baseT = start;
	let trackLen = Number(track.trackLength);
	if (!trackLen) return [];
	while (baseT < endT) {
		let rowList = forceArray(track.noteRows.noteRow);
		for (var rx = 0; rx < rowList.length; ++rx) {
			let row = rowList[rx];
			var noteData = row.noteData;
			let y = rowYfilter(row);
			if (y < 0) continue;
			for (var nx = 2; nx < noteData.length; nx += 20) {
				let notehex = noteData.substring(nx, nx + 20);
				let x = parseInt(notehex.substring(0, 8), 16);
				let dur =  parseInt(notehex.substring(8, 16), 16);
				let vel = parseInt(notehex.substring(16, 18), 16);
//				let cond = parseInt(notehex.substring(18, 20), 16);
				let tX = Math.round((x + baseT) * midiPPQ / delugePPQ);
				let tDur = Math.round(dur * midiPPQ / delugePPQ);
				let velN = vel / 127;
				let onTime = tX;
				let offTime = onTime + tDur;

				let note = new Note({midi: y, ticks: onTime, velocity: velN, channel: chan},{ticks: offTime, velocity: 0, channel: chan}, head);

				midiOut.push(note);
			}
		}
		baseT+= trackLen;
	}
	midiOut.sort((a,b)=>{ return a.ticks - b.ticks});

	return midiOut;
}

*/

function encodeAsMidi13(track, start, len, chan, timeoff, clipS, clipE, head) {
// first walk the track and find min and max y positions
	let trackLen = Number(track.trackLength);
	if (!trackLen) return [];
	let endT = start + len;
	let midiOut = [];
	let baseT = start;
	console.log("Midi13 timeoff: " + timeoff + " baseT: " + baseT);
	let rowList = forceArray(track.noteRows.noteRow);
	while (baseT < endT) {
		for (var rx = 0; rx < rowList.length; ++rx) {
			let row = rowList[rx];
			var noteList = forceArray(row.notes.note);
			let y = rowYfilter(row);
			if (y < 0) continue;
			for (var nx = 0; nx < noteList.length; ++nx) {
				let n = noteList[nx];
				let x = Number(n.pos);
				let dur = Number(n.length);
				let vel = Number(n.velocity) / 127;
				let note = clipNote(y, x + baseT, vel, dur, chan, timeoff, clipS, clipE, head);
				if (note) {
					midiOut.push(note);
				}
			}
		}
		baseT+= trackLen;
		//timeoff += trackLen;
	}
	midiOut.sort((a,b)=>{ return a.ticks - b.ticks});
	return midiOut;
}

/* 
function encodeAsMidi13OLD(track, start, len, chan, timeoff, clipS, clipE, head){
// first walk the track and find min and max y positions
	let midiPPQ = head.ppq;
	let trackLen = Number(track.trackLength);
	if (!trackLen) return [];
	let endT = start + len;
	let midiOut = [];
	let baseT = start;

	let rowList = forceArray(track.noteRows.noteRow);
	while (baseT < endT) {
		for (var rx = 0; rx < rowList.length; ++rx) {
			let row = rowList[rx];
			var noteList = forceArray(row.notes.note);
			let y = rowYfilter(row);
			if (y < 0) continue;
			for (var nx = 0; nx < noteList.length; ++nx) {
				let n = noteList[nx];
				let x = Number(n.pos);
				let dur = n.length;
				let vel = n.velocity / 127;
				let tX = Math.round((x + baseT) * midiPPQ / delugePPQ);
				let tDur = Math.round(dur * midiPPQ / delugePPQ);
				let onTime = tX;
				let offTime = onTime + tDur;
				let note = new Note({midi: y, ticks: onTime, velocity: vel, channel: chan},{ticks: offTime, velocity: 0, channel: chan}, head);
				midiOut.push(note); 
			}
		}
		baseT+= trackLen;
	}
	midiOut.sort((a,b)=>{ return a.ticks - b.ticks});
	return midiOut;
}

*/


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

function encodeAsMidi(track, start, len, chan, timeoff, clipS, clipE,  head) {
	if(usesNewNoteFormat(track)) {
		return encodeAsMidi14(track, start, len, chan, timeoff, clipS, clipE, head);
	} else {
		return encodeAsMidi13(track, start, len, chan, timeoff, clipS, clipE, head);
	}
}

function encodeInstrumentAsMidiTrack(inst, lane, song, timeoff, head)
 {
	let instString = inst.trackInstances;
	if (!instString) return [];
	let trackTab = forceArray(song.tracks.track);
	let maxTrack = trackTab.length;
	let midiOut = [];
	let highTime =  0;

	let arrangeOnlyTab = [];
	if (song.arrangementOnlyTracks) {
		arrangeOnlyTab = forceArray(song.arrangementOnlyTracks.track);
	}
	for (var nx = 2; nx < instString.length; nx += 24) {
		let start = parseInt(instString.substring(nx, nx + 8), 16);
		let len = parseInt(instString.substring(nx + 8, nx + 16), 16);
		let trk = parseInt(instString.substring(nx + 16, nx + 24), 16);
		let endT = start + len;
		if (endT > highTime) highTime = endT;
		let track;
		if (trk < maxTrack) {
			track = trackTab[trk];
		} else {
			track = (arrangeOnlyTab.length - trk & 0x7FFFFFFF)
		}
		if (track) {
			let toMidiChan = lane % 16;
			if (track.midiChannel) {
				toMidiChan = Number(track.midiChannel);
			}
			midiOut = midiOut.concat(encodeAsMidi(track, start, len, toMidiChan, timeoff, 0, 0, head));
		}
	}
	midiOut.sort((a,b)=>{ return a.ticks - b.ticks});
	return midiOut;
}

// Return song tempo calculated from timePerTimerTick and timerTickFraction
function convertTempo(jsong)
{
	let fractPart = (jsong.timerTickFraction>>>0) / 0x100000000;
	let realTPT = Number(jsong.timePerTimerTick) + fractPart;
	let tempo = Math.round(551250 / realTPT) / 10;
	return tempo;
}

function addMetadataTrack(song, midi) {
	let tempo = convertTempo(song);
	let	songName = "";
	
	let json = {
		"name": songName,
		tempos: [{ticks : 0, bpm : tempo}],
		timeSignatures: [{ticks : 0, timeSignature : [4, 4]}],
		meta: [],
		ppq:  48
	};

	let head = midi.header;
	head.fromJSON(json);
};

function makeEmptyFile() {
	let tempo = 120;
	let	songName = "";
	let midi = new Midi(null);
	let json = {
		"name": songName,
		tempos: [{ticks : 0, bpm : tempo}],
		timeSignatures: [{ticks : 0, timeSignature : [4, 4]}],
		meta: [],
		ppq:  48
	};

	let head = midi.header;
	head.fromJSON(json);

	return midi;
};

function doesSongHaveArrangement(song) {
	let instruments = forceArray(song.instruments);
	let has = instruments.reverse().find((inst) =>{
		let tiString = inst.trackInstances;
		if (!tiString) return false;
		if (tiString.length > 0) return true;
		return false;
	});
	return has !== undefined;
}

function delugeToMidiArranged(midi, song) {
	let instruments = forceArray(song.instruments);
	instruments.map((inst, ix) =>{
		let midiTrack = midi.addTrack();
		let noteData = encodeInstrumentAsMidiTrack(inst, ix, song, 0, midi.header);
		midiTrack.notes = noteData;
	});
}

function addTrackToMidi(midiDoc, song, trackNum, timeoff, clipS, clipE) {
	let delTrackTab = forceArray(song.tracks.track);
	let delTrack = delTrackTab[delTrackTab.length - trackNum];
	let trackLen = Number(delTrack.trackLength);
	let toMidiChan = 0;
	if (delTrack.midiChannel) {
		toMidiChan = Number(delTrack.midiChannel);
	}
	let midiTrack = midiDoc.midi.addTrack();
	midiTrack.channel = toMidiChan;
	let notes = encodeAsMidi(delTrack, 0, trackLen, toMidiChan, timeoff, clipS, clipE, midiDoc.midi.header);
	midiTrack.notes = midiTrack.notes.concat(notes);
	midiTrack.notes.sort((a,b)=>{ return a.ticks - b.ticks});
}

function convertAllTracks(midi, song) {
	let delTrackTab = forceArray(song.tracks.track);
//	for (let i = delTrackTab.length; i >= 1; i--) {
	for (let i = 1; i <= delTrackTab.length; ++i) {
		addTrackToMidi(midi, song, i, 0, 0, 0);
	}
}

function converter(midiDoc, song) {
	if(doesSongHaveArrangement(song)) {
		delugeToMidiArranged(midiDoc.midi, song);
	} else {
		convertAllTracks(midiDoc, song);
	}
}

export {converter, addTrackToMidi, makeEmptyFile};