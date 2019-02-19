import $ from'./js/jquery-3.2.1.min.js';

class MidiConversion {
  constructor(midi) {
	this.midi = midi;
  }

  convertTrackToDeluge(trackNum, startTime, endTime, tickOffset) {
	let midi = this.midi;
	let midiPPQ = midi.header.ppq;
	console.log("MidiPPQ= " + midiPPQ);
	let delugePPQ = 48;
	let track = midi.tracks[trackNum - 1];
	let notes = track.notes;
	let noteCount = notes.length;
	let lanes = [];

	let trackOut= this.protoTrack();
	let trout = trackOut.track;

	// sort notes by note number filtering for time interval
	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let m = n.midi;
		let t = n.time;
		let tend = t + n.duration;
		if (t > endTime || tend < startTime) continue;
		if (lanes[m] === undefined) {
			lanes[m] =[];
		}
		lanes[m].push(n);
	}
	
	let clipMax = 0;

	
	for (let i = 0; i < lanes.length; ++i) {
		let lastStart = -1;
		let lastEnd = -1;
		if(lanes[i] === undefined) continue;
		let lane = lanes[i];
		// lane.sort((a,b)=>{if (a.ticks > b.ticks) return 1; else if (a.ticks < b.ticks) return -1; else return 0;});
		let laneh = "0x";
		for (let nx = 0; nx < lane.length; ++nx) {
			let n = lane[nx];
			let tMstart = n.ticks - tickOffset;
			let tMdur = n.durationTicks;
			let tMend = tMstart + tMdur;
			if (tMstart <= lastStart) {
				console.log("*** Out of order MIDI: " + tMstart + " <= " + lastStart);
			}
			if (tMstart < lastEnd) {
				console.log("*** Overlapping note: " + tMstart + " <= " + lastEnd);
			} 
			
			lastStart = tMstart;
			lastEnd = tMend;

			let tDstart = Math.round(tMstart * delugePPQ / midiPPQ);
			let tDdur = Math.round(tMdur * delugePPQ / midiPPQ);
			let tDnoteEnd = tDstart + tDdur;
			if (tDnoteEnd > clipMax) clipMax = tDnoteEnd;
			let tDvel = Math.round(n.velocity * 127);
			// hex digits:	0-7		start
//				8-15	duration
//				16-17	velocity
//				18-19	conditionCode, default = 0x14
			let hStart = (tDstart + 0x100000000).toString(16).substring(1);
			let hDur = (tDdur + 0x100000000).toString(16).substring(1);
			let hVel = (tDvel + 0x100).toString(16).substring(1);
			let hCC = "14";
			let h = hStart + hDur + hVel + hCC;
			// Deluge won't accept lower-case a-f in hex constants!
			laneh += h.toUpperCase();
		}
		let noteData = {"y": i, "noteData": laneh}
		trout.noteRows.noteRow.push(noteData);
	}
	// trout.midiChannel = midi.header.
	trout.trackLength = clipMax;
	return trackOut;
  }

  calcTimeBounds() {
	let midi = this.midi;
	if (!midi) return;
	
	let lowTime = 100000000;
	let highTime = -100000000;
	let lowTicks = 100000000;
	let highTicks = -100000000;

	for(let tn = 0; tn < midi.tracks.length; ++tn) {
		let track = midi.tracks[tn];
		let notes = track.notes;
		let noteCount = notes.length;
		for (let i = 0; i < noteCount; ++i) {
			let n = notes[i];
			let t = n.time;
			let tend = t + n.duration;
			if (t < lowTime) lowTime = t;
			if (tend > highTime) highTime = tend;
			
			let tt = n.ticks;
			let ttend = tt + n.durationTicks;
			if (tt < lowTicks) lowTicks = tt;
			if (ttend > highTicks) highTicks = ttend;
		}
	}
	this.lowTime = lowTime;
	this.highTime = highTime;
	this.lowTicks = lowTicks;
	this.highTicks = highTicks;
  }

  protoTrack() {
   let proto = 
{
	 track: {
	  inKeyMode: 0,
	  yScroll: 60,
	  yScrollKeyboard: 50,
	  isPlaying: 0,
	  isSoloing: 0,
	  playEnabledAtStart: 1,
	  trackLength: 192,
	  colourOffset: -60,
	  beingEdited: 0,
	  activeModFunction: 0,
	  midiChannel: 0,
	  section: 0,
	  noteRows: {
	   		noteRow: [],
		}
	 }
	}
	return proto;
  }

} // of class

export {MidiConversion};
