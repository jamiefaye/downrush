import $ from'./js/jquery-3.2.1.min.js';
import {formatSound, formatSampleEntry} from "./viewXML.js";
import {sample_list_header, wavegroup_template} from "./templates.js";
import {forceArray} from "./JsonXMLUtils.js";
import WaveSurfer from './js/wavesurfer.js';
import RegionPlugin  from'./js/plugins/wavesurfer.regions.js';
import {TiledRenderer, tiledDrawBuffer} from './js/plugins/wavesurfer.tiledrenderer.js';
import Wave from './Wave.js';
import {audioCtx, OfflineContext} from './AudioCtx.js';

/*******************************************************************************

	KIT

 *******************************************************************************
*/

var KIT_SOUND_NAMES = ["KICK",
"SNARE",
"HATC",
"HATO",
"SHAK",
"TAMB",
"CLAV",
"CLAP",
"CRAS",
"COWB",
"MARACA",
"RIDE",
"RIM",
"TOMB",
"TOMH",
"TOML",
"TOMM",
"TOMT",
"TRIA",
"SNAP",
"BLOC",
"BONH",
"BONL",
"CABA",
"CHIM",
"CHIN",
"CLIC",
"CONH",
"CONL",
"CONM",
"CONT",
"DRON",
"GUIR",
"HCLO",
"HOME",
"META",
"PERC",
"QUIJ",
"RANK",
"SOLA",
"TIMH",
"TIML",
"TRAS",
"TRUC"];


function openKitSound(e, kitTab, kitParams, track) {
	let target = e.target;
	let ourX = Number(target.getAttribute('kitItem'));

	var aKitSound;
	if (ourX >= 0) {
		aKitSound = kitTab[ourX];
	} else {
		aKitSound = kitParams;
		if(!aKitSound) return;
	}

	let ourRow = target.parentNode;
	let nextRow = ourRow.nextElementSibling;
	let ourTab = ourRow.parentNode;
	if (nextRow && nextRow.classList.contains('soundentry')) {
		ourTab.removeChild(nextRow);
		target.textContent = "►";
		return;
	}
	var noteSound = {};
	if(track && track.noteRows && ourX >= 0) {
		let noteRowA= forceArray(track.noteRows.noteRow);
		for (var i = 0; i < noteRowA.length; ++i) {
			let aRow = noteRowA[i];
			if(Number(aRow.drumIndex) === ourX) {
				 noteSound = aRow.soundParams;
				 break;
			}
		}
	}

	let newRow = $("<tr class='soundentry'/>");
	let newData =$("<td  colspan='8'/>");

	formatSound(newData, aKitSound, aKitSound.defaultParams, aKitSound.soundParams, noteSound);

	newRow.append(newData);
	if (nextRow) {
		ourTab.insertBefore(newRow[0], nextRow);
	} else {
		ourTab.appendChild(newRow[0]);
	}
	target.textContent = "▼";
}

function openKitWave(e, kitTab, kitParams, track) {
	let target = e.target;
	let ourX = Number(target.getAttribute('kitItem'));

	var aKitSound;
	if (ourX >= 0) {
		aKitSound = kitTab[ourX];
	} else {
		aKitSound = kitParams;
		if(!aKitSound) return;
	}

	let ourRow = target.parentNode;
	let nextRow = ourRow.nextElementSibling;
	let ourTab = ourRow.parentNode;
	if (nextRow && nextRow.classList.contains('soundentry')) {
		ourTab.removeChild(nextRow);
		target.textContent = "►";
		return;
	}
	

	var noteSound = {};
	if(track && track.noteRows && ourX >= 0) {
		let noteRowA= forceArray(track.noteRows.noteRow);
		for (var i = 0; i < noteRowA.length; ++i) {
			let aRow = noteRowA[i];
			if(Number(aRow.drumIndex) === ourX) {
				 noteSound = aRow.soundParams;
				 break;
			}
		}
	}

	let newRow = $("<tr class='soundentry'/>");
	let newData =$("<td  colspan='8'/>");

	// formatSound(newData, aKitSound, aKitSound.defaultParams, aKitSound.soundParams, noteSound);
	let filePath = "/" + aKitSound.osc1.fileName;
	var kitEditor;
	if (filePath) {
		console.log("open: " + filePath);
		kitEditor = new KitEdit(filePath);
		newData.append(kitEditor.waveElement);
		newRow.append(newData);
		kitEditor.loadFile(filePath);
	}
	if (nextRow) {
		ourTab.insertBefore(newRow[0], nextRow);
	} else {
		ourTab.appendChild(newRow[0]);
	}
	target.textContent = "▼";
}


function formatKit(json, obj, kitParams, track) {
	
	let kitList = forceArray(json.soundSources.sound);
	
	let tab = $("<table class='kit_tab'/>");
	let hasKitParams = kitParams !== undefined;
	tab.append(sample_list_header({hasKitParams: hasKitParams}));
	
	for(var i = 0; i < kitList.length; ++i) {
		let kit = kitList[i];
		formatSampleEntry(kit, tab, i);
	}

	obj.append(tab);

	let opener = function (e) {
		let js = json;
		// openKitSound(e, kitList, kitParams, track);
		openKitWave(e, kitList, kitParams, track);
	};
	$('.kit_opener').on('click', opener);
}



var gIdCounter = 0;

class KitEdit {
	
  constructor(fname, whenDone) {
	this.fname = fname;
	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.homeId = this.idFor(name);
	this.whenDone = whenDone;
	this.waveElement = wavegroup_template({idsuffix: this.idNumber});
  }

  idFor(root) {
	return '#' + root + this.idString;
  }

  setEditData(data)
{
	if(!this.wave) {
		this.wave = new Wave(this.idFor('waveform'));
	}
	this.wave.openOnBuffer(data);
	if(this.whenDone) {
		this.whenDone(data);
	}
	// this.startGuiCheck();
	// let loadEndTime = performance.now();
	// console.log("Load time: " + (loadEndTime - loadStartTime));
}

// use ajax to load wav data
  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		//me.whenDone(data);
		me.setEditData(data);
	},

	error: function (data, textStatus, jqXHR) {
		console.log("Error: " + textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType= 'blob';
		return xhr;
	},

	});
}

	
	
}; // End of class


export {formatKit};