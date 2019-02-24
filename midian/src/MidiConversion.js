import mpcpattern_file_tamplate from "./templates/mpcpattern_file_template.handlebars";

class MidiConversion {
  constructor(midi) {
	this.midi = midi;
  }

  convertTrackToDeluge(trackNum, startTime, endTime, masterTicks, dontAdjustToClip) {
	let midi = this.midi;
	let midiPPQ = midi.header.ppq;
	console.log("MidiPPQ= " + midiPPQ);
	let delugePPQ = 48;
	let track = midi.tracks[trackNum - 1];
	let chanMask = this.channelMasks[trackNum - 1];
	let chanNum = 0;

	// Output all the events in this track on the lowest channel number found in it.
	// so we need to find the lowest-order one bit.
	if (chanMask) {
		let bit = 1;
		while ((bit & chanMask) === 0) {
			bit = bit << 1;
			chanNum++;
		}
	}

	let notes = track.notes;
	let noteCount = notes.length;
	let lanes = [];

	let trackOut= this.protoTrack();
	let trout = trackOut.track;

	let tickOffset = masterTicks;

	if (startTime === endTime) {
		startTime = 0;
		endTime = 10000000;
	} else if(!dontAdjustToClip) {
		tickOffset = this.calcTrackLowTick(track, startTime, endTime);
	}

	// sort notes by note number filtering for time interval
	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let m = n.midi;
		let t = n.time;
		let tend = t + n.duration;
		if (t >= endTime || tend <= startTime) continue;
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
	trout.midiChannel = chanNum;
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
	let maskList = [];
	for(let tn = 0; tn < midi.tracks.length; ++tn) {
		let channelMask = 0;
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
			let c = n.channel;
			if (c !== undefined) {
				channelMask |= (1 << c);
			}
		}
		maskList.push(channelMask);
	}
	this.lowTime = lowTime;
	this.highTime = highTime;
	this.lowTicks = lowTicks;
	this.highTicks = highTicks;
	this.channelMasks = maskList;
  }

  calcTrackLowTick(track, start, end) {
	let lowTicks = this.highTicks;
	let notes = track.notes;
	let noteCount = notes.length;
	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let t = n.time;
		let tend = t + n.duration;
		if (t >= end || tend <= start) continue;
		let tt = n.ticks;
		if (tt < lowTicks) lowTicks = tt;
	}
	return lowTicks;
  }

  protoTrack() {
   let proto = 
{
	 track: {
	  inKeyMode: 0,
	  yScroll: 60,
	  yScrollKeyboard: 50,
	  isPlaying: 1,
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

  convertTrackToMPC(trackNum, startTime, endTime, masterTicks, dontAdjustToClip) {
	let midi = this.midi;
	let midiPPQ = midi.header.ppq;
	console.log("MidiPPQ= " + midiPPQ);
	let forcePPQ = 960;
	let track = midi.tracks[trackNum - 1];
	let chanMask = this.channelMasks[trackNum - 1];
	let chanNum = 0;

	// Output all the events in this track on the lowest channel number found in it.
	// so we need to find the lowest-order one bit.
	if (chanMask) {
		let bit = 1;
		while ((bit & chanMask) === 0) {
			bit = bit << 1;
			chanNum++;
		}
	}

	let notes = track.notes;
	let noteCount = notes.length;

	let tickOffset = masterTicks;

	if (startTime === endTime) {
		startTime = 0;
		endTime = 10000000;
	} else if(!dontAdjustToClip) {
		tickOffset = this.calcTrackLowTick(track, startTime, endTime);
	}

	// Encode the notes into an array of Json objects.
	let notesOut = [];
	
	let clipMax = 0;

	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let m = n.midi;
		let t = n.time;
		let tend = t + n.duration;
		if (t >= endTime || tend <= startTime) continue;

		let tMstart = n.ticks - tickOffset;
		let tMdur = n.durationTicks;
		let tMend = tMstart + tMdur;
		
		let tDstart = Math.round(tMstart * forcePPQ / midiPPQ);
		let tDdur = Math.round(tMdur * forcePPQ / midiPPQ);
		let tDnoteEnd = tDstart + tDdur;
		if (tDnoteEnd > clipMax) clipMax = tDnoteEnd;
		let velString = n.velocity.toString(10);
		let trimedVel = velString.substring(0,17);
		let nj = {
			"type":		2,
			"time": 	tDstart,
			"duration": tDdur,
			"note": 	m,
			"velocity": trimedVel,
			"3": 		0,
			"mod": 		0,
			"modVal": 	0.5,
			"isNotLast": i < (noteCount - 1),
		};
		notesOut.push(nj);
	}
	
	let context = {events: notesOut};
	let mpcOut = mpcpattern_file_tamplate(context);
	return mpcOut;
  }
} // end class.

export {MidiConversion};
