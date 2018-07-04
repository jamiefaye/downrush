

// Javascript does not specify a key-oder for enumerating properties of an object.
// This means that element ordering may have been altered by edits, or the mere
// act of going from XML to JSON. We fix this by consulting a table showing the
// natural order of XML elements observed in Deluge files, and using that to
// determine the order keys are written-out. While XML does not specify any
// element ordering policies, some developers expect some elements to always
// appear before certain others.
	
 var keyOrderTab = {
 "song": ["previewNumPads",
"preview",
"xScroll",
"xZoom",
"yScrollSongView",
"yScrollArrangementView",
"xScrollArrangementView",
"xZoomArrangementView",
"timePerTimerTick",
"timerTickFraction",
"rootNote",
"inputTickMagnitude",
"swingAmount",
"swingInterval",
"modeNotes",
"reverb",
"affectEntire",
"activeModFunction",
"lpfMode",
"modFXType",
"delay",
"modFXCurrentParam",
"currentFilterType",
"songParams",
"instruments",
"sections",
"tracks",
],
"modeNotes": ["modeNote",
],
"reverb": ["roomSize",
"dampening",
"width",
"pan",
"compressor",
],
"compressor": ["attack",
"release",
"volume",
"syncLevel",
],
"delay": ["rate",
"feedback",
"pingPong",
"analog",
"syncLevel",
],
"songParams": ["delay",
"reverbAmount",
"volume",
"pan",
"lpf",
"hpf",
"modFXDepth",
"modFXRate",
"stutterRate",
"sampleRateReduction",
"bitCrush",
"equalizer",
"modFXOffset",
"modFXFeedback",
],
"lpf": ["frequency",
"resonance",
],
"hpf": ["frequency",
"resonance",
],
"equalizer": ["bass",
"treble",
"bassFrequency",
"trebleFrequency",
],
"sections": ["section",
],
"section": ["id",
"numRepeats",
],
"tracks": ["track",
],
"track": ["inKeyMode",
"yScroll",
"yScrollKeyboard",
"status",
"isPlaying",
"isSoloing",
"playEnabledAtStart",
"trackLength",
"colourOffset",
"beingEdited",
"affectEntire",
"activeModFunction",
"instrument",
"instrumentPresetSlot",
"instrumentPresetSubSlot",
"midiChannel",
"modKnobs",
"section",
"sound",
"soundParams",
"kit",
"kitParams",
"noteRows",
],
"instrument": ["referToTrackId",
],
"modKnobs": ["modKnob",
],
"modKnob": ["controlsParam",
"patchAmountFromSource",
"cc",
"value",
],
"noteRows": ["noteRow",
],
"noteRow": ["y",
"muted",
"colourOffset",
"drumIndex",
"soundParams",
"notes",
"noteData",
],
"notes": ["note",
],
"note": ["length",
"velocity",
"pos",
],
"kit": ["lpfMode",
"modFXType",
"delay",
"modFXCurrentParam",
"currentFilterType",
"soundSources",
"selectedDrumIndex",
],
"sound": ["name",
"osc1",
"osc2",
"polyphonic",
"clippingAmount",
"voicePriority",
"sideChainSend",
"lfo1",
"lfo2",
"mode",
"modulator1",
"modulator2",
"transpose",
"unison",
"compressor",
"lpfMode",
"modFXType",
"delay",
"defaultParams",
"midiKnobs",
"modKnobs",
],
"osc1": ["type",
"transpose",
"cents",
"retrigPhase",
"loopMode",
"reversed",
"timeStretchEnable",
"timeStretchAmount",
"fileName",
"zone",
],
"zone": ["startMilliseconds",
"endMilliseconds",
],
"osc2": ["type",
"transpose",
"cents",
"retrigPhase",
"loopMode",
"reversed",
"timeStretchEnable",
"timeStretchAmount",
"fileName",
"zone",
],
"lfo1": ["type",
"syncLevel",
],
"lfo2": ["type",
],
"unison": ["num",
"detune",
],
"defaultParams": ["arpeggiatorGate",
"portamento",
"compressorShape",
"oscAVolume",
"oscAPulseWidth",
"oscBVolume",
"oscBPulseWidth",
"noiseVolume",
"volume",
"pan",
"lpfFrequency",
"lpfResonance",
"hpfFrequency",
"hpfResonance",
"envelope1",
"envelope2",
"lfo1Rate",
"lfo2Rate",
"modulator1Amount",
"modulator1Feedback",
"modulator2Amount",
"modulator2Feedback",
"carrier1Feedback",
"carrier2Feedback",
"modFXRate",
"modFXDepth",
"delayRate",
"delayFeedback",
"reverbAmount",
"arpeggiatorRate",
"patchCables",
"stutterRate",
"sampleRateReduction",
"bitCrush",
"equalizer",
"modFXOffset",
"modFXFeedback",
],
"envelope1": ["attack",
"decay",
"sustain",
"release",
],
"envelope2": ["attack",
"decay",
"sustain",
"release",
],
"patchCables": ["patchCable",
],
"patchCable": ["source",
"destination",
"amount",
"rangeAdjustable",
],
"kitParams": ["delay",
"reverbAmount",
"volume",
"pan",
"lpf",
"hpf",
"modFXDepth",
"modFXRate",
"stutterRate",
"sampleRateReduction",
"bitCrush",
"equalizer",
"modFXOffset",
"modFXFeedback",
],
"soundParams": ["arpeggiatorGate",
"portamento",
"compressorShape",
"oscAVolume",
"oscAPulseWidth",
"oscBVolume",
"oscBPulseWidth",
"noiseVolume",
"volume",
"pan",
"lpfFrequency",
"lpfResonance",
"hpfFrequency",
"hpfResonance",
"envelope1",
"envelope2",
"lfo1Rate",
"lfo2Rate",
"modulator1Amount",
"modulator1Feedback",
"modulator2Amount",
"modulator2Feedback",
"carrier1Feedback",
"carrier2Feedback",
"modFXRate",
"modFXDepth",
"delayRate",
"delayFeedback",
"reverbAmount",
"arpeggiatorRate",
"patchCables",
"stutterRate",
"sampleRateReduction",
"bitCrush",
"equalizer",
"modFXOffset",
"modFXFeedback",
],
"modulator1": ["transpose",
"cents",
"retrigPhase",
],
"modulator2": ["transpose",
"cents",
"retrigPhase",
"toModulator1",
],
"midiOutput": ["channel",
"note",
],
};

var genDict;
// Generate entries for element ordering tables
function xmlToOrderTab(xml) {
	let accum = '';
	let ourName = xml.nodeName;
	let levelSet = new Set();
	if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) return;

	accum += '"' + ourName + '": [\n';
	
	if (xml.hasChildNodes()) {
		let levelA = genDict[ourName];
		if (!levelA) {
			levelA = [];
			genDict[ourName] = levelA;
		}
		let prevElemName = undefined;
		for (let i = 0; i < xml.childNodes.length; i += 1) {
			let item = xml.childNodes.item(i);
			if (item.nodeType === 3) continue;
			let itemName = item.nodeName;
			if (levelSet.has(itemName)) continue;
			if (levelA.indexOf(itemName) === -1) {
				let insertAt = 0;
				if(prevElemName !== undefined) {
					insertAt = levelA.indexOf(prevElemName) + 1;
				}
				levelA.splice(insertAt, 0, itemName);
	 			levelSet.add(itemName);
			}
			prevElemName = itemName;
		}
	}

	for (let i = 0; i < xml.childNodes.length; i += 1) {
	 	let item = xml.childNodes.item(i);
	 	xmlToOrderTab(item);
	}
}

function genOrderTab(xml) {
	genDict = {};
	let genStr = '';
	xmlToOrderTab(xml);
	for(var ek in genDict) { 
		if(genDict.hasOwnProperty(ek)) {
			genStr += '"' + ek + '": [';
			let ka = genDict[ek];
			for (var i = 0; i < ka.length; ++i) {
				genStr += '"' + ka[i] + '",\n';
			}
			genStr += '],\n';
		}
	}
	console.log(genStr);
}

// heteroArrays is used to flag an element name that should always create a json
// array for its subelements. Needed to cope with mixed element types.
var heteroArrays = new Set();

heteroArrays.add('instruments');
heteroArrays.add('soundSources');
export {keyOrderTab, heteroArrays};