import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc, setFocusMidiView, setAddToDocFunction, setMpcEnabled, setClipboardEnabled} from './MidiDoc.jsx';

require('file-loader?name=index.html!../html/index_web.html');
require('file-loader?name=[name].[ext]!../css/midian.css');
require('file-loader?name=[name].[ext]!../../xmlView/css/edit.css');
import filegroup_template from "./templates/filegroup_template.handlebars";
import local_exec_head from "./templates/local_exec_head.handlebars";
import local_exec_info from "./templates/local_exec_info.handlebars";
import local_exec_song_group from "./templates/local_exec_song_group.handlebars";
import empty_song_template from "./templates/empty_song.handlebars";

import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import FileSaver from 'file-saver';
import {setFocusDoc, makeDelugeDoc, getFocusDoc, pasteTrackJson} from "../../xmlView/src/SongViewLib.js";

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = true;
var sample_path_prefix = '/';

// Used to enable 'multiple samples open on one page'.
var multiDocs = false;

var gIdCounter = 0;
var localClipboard;

var focusMidiView;
var firstOpened = false;

function registerGlobalHandlers() {
	console.log('register global handlers');
}

class MidiViewer {
  constructor(name) {

	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.homeId = this.idFor(name);
	this.html = filegroup_template({idsuffix: this.idNumber});
  }

  idFor(root) {
	return '#' + root + this.idString;
  }

  bindGui() {
	let me = this;
	let id = this.idFor('butnrow');
	let baseEl = $(id);
}


/*
// Chrome decided to only allow the browser access to the microphone when the page has been served-up via https
// since the FlashAir card doesn't do that, we can't record audio. Another annoying browser incapacity.
function record()
{
	var mike = new Microphone({}, this.wave.surfer);

	mike.start();
}
*/

// data = DOMException: Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).


//editor
  setEditData(data)
{
	if(!this.midiDoc) {
		this.midiDoc = openMidiDoc($(this.idFor('midianview'))[0]);
	}
	this.midiDoc.openOnBuffer(data);
}


  openLocal(evt)
 {
 	let me = this;

	if (firstOpened && multiDocs) {
		 that = new MidiViewer('midiview');
		 $('#midiview').append(me.html);
		 me.bindGui();
		 focusMidiView = that;
		 setFocusMidiView(focusMidiView)
	}
	firstOpened = true;
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	this.fname = f;
	var reader = new FileReader();
	if(!me.midiDoc) {
		me.midiDoc = openMidiDoc($(this.idFor('midianview'))[0]);
	}

// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		me.midiDoc.openOnBuffer(theFile);
	})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
 }

}; // ** End of class

//.value

function downloader(evt) {
	let focusDoc = getFocusDoc();
	if(!focusDoc) return;
	let saveXML = focusDoc.genDocXMLString();
	var blob = new Blob([saveXML], {type: "text/xml;charset=utf-8"});
	let saveName;
	if (local_exec) {
		saveName = focusDoc.fname.name 
	} else {
		saveName = focusDoc.fname.split('/').pop();
	}
	if (!saveName) saveName ='SONG.XML';
	console.log(saveName);
	FileSaver.saveAs(blob, saveName);
}

//---------- When reading page -------------
function onLoad()
{
	let homeDoc = new MidiViewer('midiview');
	$('#midiview').append(homeDoc.html);

	if(!focusMidiView) {
		focusMidiView = homeDoc;
		setFocusMidiView(focusMidiView)
		registerGlobalHandlers();
	}

	$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	$('#openlocalsongbutn').on('change', (e)=>{openSongLocal(e)});
	$('#downloadbut').click((e)=>{downloader(e)});
	
	homeDoc.bindGui();

	createEmptySong();
}

function setSongText(fname, text)
{
	let focusDoc = makeDelugeDoc(fname, text, false, true);
	setFocusDoc(focusDoc);
}


function openSongLocal(evt)
 {
 	let me = this;
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var fname = f;
	var reader = new FileReader();

	reader.onloadend = (function(theFile) {
		return function(e) {
			// Display contents of file
				let t = e.target.result;
				setSongText(theFile, t);
				$("#statind2").text(fname + " loaded.");

			};
	})(f);
	
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
 }

 function addToDocFunction(jsonTrack) {
 	pasteTrackJson(jsonTrack, getFocusDoc());
 }

setAddToDocFunction(addToDocFunction);
setMpcEnabled(false);
setClipboardEnabled(true);
function createEmptySong()
{
	let data = empty_song_template();
	setSongText("/SONGS/SONG.XML", data);
}


window.onload = onLoad;
