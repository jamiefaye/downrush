import mpcpattern_file_tamplate from "./templates/mpcpattern_file_template.handlebars";


const hexTab = ["0", "1", "2", "3",
				"4", "5", "6","7", 
				"8", "9", "A", "B",
				"C", "D", "E", "F"];

function hexLZ32(v) {
	let result = "";
	let shifty = 28;
	for (let shifty = 28; shifty >= 0; shifty-=4) {
		let nibble = (v >> shifty) & 0xF;
		result += hexTab[nibble];
	}
	return result;
}




// This function returns a function bound to the 
// min/max source & target ranges given.
// oMin, oMax = source
// nMin, nMax = dest.
function makeRangeMapper(oMin, oMax, nMin, nMax ){
	//range check
	if (oMin == oMax){
		console.log("Warning: Zero input range");
		return undefined;
	};

	if (nMin == nMax){
		console.log("Warning: Zero output range");
		return undefined
	}

	//check reversed input range
	var reverseInput = false;
	let oldMin = Math.min( oMin, oMax );
	let oldMax = Math.max( oMin, oMax );
	if (oldMin != oMin){
	    reverseInput = true;
	}

	//check reversed output range
	var reverseOutput = false;  
	let newMin = Math.min( nMin, nMax )
	let newMax = Math.max( nMin, nMax )
	if (newMin != nMin){
	    reverseOutput = true;
	}

	// Hot-rod the most common case.
	if (!reverseInput && !reverseOutput) {
		let dNew = newMax-newMin;
		let dOld = oldMax-oldMin;
 		return (x)=>{
			return ((x-oldMin)* dNew / dOld) + newMin;
		}
	}

	return (x)=>{
		let portion;
		if (reverseInput){
			portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
		} else {
			portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin)
		}
		let result;
		if (reverseOutput){
			result = newMax - portion;
		} else {
			result = portion + newMin;
		}
		
		return result;
	}	
}

class ConversionContext {
	constructor(midi) {
		this.startTime = 0;
		this.endTime = Number.MAX_SAFE_INTEGER;
		this.tickOffset = 0;
		this.sourcePPQ = midi.header.ppq;;
		this.destPPQ = 48;
		this.scaleValueBy = 1;
	}

	clipIsOn() {
		if (this.beginClip === 0 && this.endClip >= MAX_SAFE_INTEGER) return false;
		if (this.beginClip >= this.endClip) return false;
		return true;
	}

	convertTime(t) {
		return ( Math.round(Number(t) * this.destPPQ / this.sourcePPQ) );
	}

	convertTimeRO(t) {
		return ( Math.round((Number(t) - this.tickOffset) * this.destPPQ / this.sourcePPQ) );
	}

	convertTimeDtoS(t) {
		return ( Math.round(Number(t) * this.sourcePPQ / this.destPPQ) );
	}
}


let normTo32Fn = makeRangeMapper(0, 1, -0x80000000, 0x7FFFFFFF);
let map0to127to32Fn = makeRangeMapper(0, 127, -0x80000000, 0x7FFFFFFF);
let range4kTo32Fn = makeRangeMapper(-0x2000, 0x1FFF, -0x80000000, 0x7FFFFFFF);

function convertNormToHex(v) {
// 0.0:	0x80000000
// 1.0: 0x7FFFFFFF
	let vs = Math.round(v * 0xFFFFFFFF) - 0x80000000
	let vs2 = Math.round(normTo32Fn(v));
	if (vs !== vs2) {
		console.log("vs = " + vs + " vs2 = " + vs2 + " from: " + v);
	}
	return hexLZ32(vs);
}


  function normValueToNex(n) {
  	 return convertNormToHex(n.value);
  }

// (n)=>{ return hexLZ32(Math.round(normTo32Fn(n.v)))}
  function range0to127ValueToNex32(n) {
  	 return hexLZ32(map0to127to32Fn(n.value));
  }

// (n)=>{ return hexLZ32(Math.round(map0to127to32Fn(n.v)))}

class MidiConversion {
  constructor(midi) {
	this.midi = midi;
  }

  convertTrackToDeluge(trackNum, startT, endT, masterTicks) {
	let midi = this.midi;
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

	if (startT === endT) {
		startT = 0;
		endT = Number.MAX_SAFE_INTEGER;
	} else {
		tickOffset = this.calcTrackLowTick(track, startT, endT);
	}

	let context = new ConversionContext(midi);
	context.startTime = startT;
	context.endTime = endT;
	context.tickOffset = tickOffset;

	// sort notes by note number filtering for time interval
	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let m = n.midi;
		let t = n.time;
		let tend = t + n.duration;
		if (t >= context.endTime || tend <= context.startTime) continue;
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
			let tMstart = n.ticks - context.tickOffset;
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

			let tDstart = context.convertTime(tMstart);
			let tDdur = context.convertTime(tMdur);
			let tDnoteEnd = tDstart + tDdur;
			if (tDnoteEnd > clipMax) clipMax = tDnoteEnd;
			let tDvel = Math.round(n.velocity * 127);
			// hex digits:	0-7		start
//				8-15	duration
//				16-17	velocity
//				18-19	conditionCode, default = 0x14
			let hStart = hexLZ32(tDstart);
			let hDur = hexLZ32(tDdur);
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

	// Control codes if present
	let ccMap = track.controlChanges;
	if (ccMap) {
		this.convertTrackCCsToDeluge(trout, track, ccMap, (n)=>hexLZ32(Math.round(normTo32Fn(n.value))), context);
	}

	const bendList = track.channelEvents['pitchBend'];
	if (bendList !== undefined && bendList.length > 0) {
		let bendMap = {'bend': bendList};
		this.convertTrackCCsToDeluge(trout, track, bendMap, (n)=>{
			return hexLZ32(Math.round(range4kTo32Fn(n.value)))
		}, context);
	}

	const chanAfterList =  track.channelEvents['channelAftertouch'];
	if (chanAfterList !== undefined && chanAfterList.length > 0) {
		let afterMap = {'aftertouch': chanAfterList};
		this.convertTrackCCsToDeluge(trout, track, afterMap, (n)=>hexLZ32(Math.round(map0to127to32Fn(n.amount))), context);
	}

	// 
	return trackOut;
  }

// a vcf is a "value conversion function" that takes a midi event object as an input, and returns
// a hexidecimal string suitable for adding to a Rohan Hill parameter encoding.
// considering an entire event lets us handle pitch bends, etc. that involve more than one midi field value.
  convertTrackCCsToDeluge(track, midiTrack, ccMap, vcf, context) {
	// ccMap ccNumber: Int : [ControlChangeEvent]
/**
 * @typedef ControlChangeEvent
 * @property {number} controllerType
 * @property {number=} value
 * @property {number=} absoluteTime
 */
	for (let key in ccMap) {
		let ccChan = key; // Number(key);
		let ccArray = ccMap[key];
		if (!ccArray || ccArray.length === 0) continue;
		let cchex = "0x";
		let bleedInEvent = undefined;
		let filteredList = [];

		// Pass 1, filter events to those in clipping range.
		for (let i = 0; i < ccArray.length; ++i) {
			let n = ccArray[i];
			if (n.time < context.startTime) {
				bleedInEvent = Object.assign({}, n);
			} else if (n.time < context.endTime) {
				filteredList.push(n);
			}
		}
		// If we have a bleed-in event and the first CC change happens after the window start, then
		// copy that bleed-in event to the front with a proper introduction time.
		if (bleedInEvent !== undefined) {
			if (filteredList.length > 0) {
				let firstEvent = filteredList[0];
				if (firstEvent.time > context. startTime) {
					bleedInEvent.ticks = context.tickOffset;
					filteredList.unshift(bleedInEvent);
				}
			} else { // If no events, but we have bleed-in then use that.
				bleedInEvent.ticks = context.tickOffset;
				filteredList.unshift(bleedInEvent);
			}
		}

		// If we only have one event, make it a constant value
		// While this discards information, the Deluge seems to presume the CC applies to the entire track
		// in this circumstance.
		if (filteredList.length === 1) {
			cchex += vcf(filteredList[0]);
		} else {
		// Generate a complete set of runs for this track, clipping them to time window requested.
			for (let nx = 0; nx < filteredList.length; ++nx) {
				let n = filteredList[nx];
				if (nx === 0) {
					cchex += vcf(n);
				}
				cchex += vcf(n);
				let runStart = context.convertTimeRO(n.ticks);
				cchex += hexLZ32(runStart);
			}
		}
		if (cchex.length <= 2) continue; // skip generating otherwise empty CC entries
		if (!track.midiParams) {
			track.midiParams = {};
			track.midiParams.param = new Array();
		}
		// console.log(cchex);
		track.midiParams.param.push({
				cc: 	ccChan,
				value:	cchex
		});
	}
  }

  findPitchBends(track) {

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

  convertTrackToMPC(trackNum, startTime, endTime, masterTicks) {
	let midi = this.midi;
	let midiPPQ = midi.header.ppq;
	//console.log("MidiPPQ= " + midiPPQ);
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
	} else {
		tickOffset = this.calcTrackLowTick(track, startTime, endTime);
	}

	// Encode the notes into an array of Json objects.
	let notesOut = [];
	
	let clipMax = 0;
	let goodNotes = [];
	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let t = n.time;
		let tend = t + n.duration;
		if (t >= endTime || tend <= startTime) continue;
		goodNotes.push(n)
	}
	let goodCount = goodNotes.length;
	for (let i = 0; i < goodCount; ++i) {
		let n = goodNotes[i];
		let m = n.midi;
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
			"isNotLast": i < (goodCount - 1),
		};
		notesOut.push(nj);
	}

	let context = {events: notesOut};
	let mpcOut = mpcpattern_file_tamplate(context);
	return mpcOut;
  }
} // end class.

export {MidiConversion};
