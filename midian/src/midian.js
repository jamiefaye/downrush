import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc} from './MidiDoc.jsx';

require('file-loader?name=[name].[ext]!../midian.htm');
require('file-loader?name=[name].[ext]!../css/midian.css');
require('file-loader?name=[name].[ext]!../../xmlView/css/edit.css');
import filegroup_template from "./templates/filegroup_template.handlebars";
import local_exec_head from "./templates/local_exec_head.handlebars";
import local_exec_info from "./templates/local_exec_info.handlebars";
import local_exec_song_group from "./templates/local_exec_song_group.handlebars";
import empty_song_template from "./templates/empty_song.handlebars";
import UndoStack from './UndoStack.js';
import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import Dropdown from './Dropdown.js';
import {openFileBrowser, saveFileBrowser, fileBrowserActive} from './FileBrowser.js';
import FileSaver from 'file-saver';
import {stepNextFile} from "./StepNextFile.js";

import {setFocusDoc, makeDelugeDoc, getFocusDoc} from "../../xmlView/lib/SongLib.js";

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;
var sample_path_prefix = '/';

// Used to enable 'multiple samples open on one page'.
var multiDocs = false;

var gIdCounter = 0;
var localClipboard;

var focusMidiView;
var firstOpened = false;

function openMidiFileDialog(e) {
	let initial;
	if (focusMidiView) initial = focusMidiView.fname;
	if (!initial) initial = '/';
	openFileBrowser({
		initialPath:  initial,
		opener: function(name) {
			openMidiFile(name);
		}
	});
}

function stepNextAsync(dir) {
	setTimeout(e=>{
		stepNextFile(focusMidiView.fname, dir, openMidiFile);
	}, 0);
}

function registerGlobalHandlers() {
	console.log('register global handlers');

	/* 
	$(window).on('paste', e=>{focusMidiView.pasteFromClip(e)});
	// iOS was screwing up if the following line was not commented out.
	$(window).on('copy', e=>{focusMidiView.copyToClip(e)});
	$(window).on('cut', e=>{focusMidiView.cutToClip(e)});

	$(window).on('undo', e=>{focusMidiView.doUndo(e)});
	$(window).on('redo', e=>{focusMidiView.doRedo(e)});
	*/

	$('.savebut').click(e=>{focusMidiView.saveAs(e)});
	$('.openmidibutn').click(e=>{openMidiFileDialog(e)});

	$('.upbut').click(e=>{
		stepNextFile(focusMidiView.fname, -1, openMidiFile);
	});
	
	$('.downbut').click(e=>{
		stepNextFile(focusMidiView.fname, 1, openMidiFile);
	});
	
	$(document).keypress(function(e){
		focusMidiView.handleKeyPress(e);
	});
	
	$('.opensongbutn').click(e=>{
		let initial; // fname
		if (!initial) initial = '/SONGS/';
		openFileBrowser({
			initialPath:  initial,
			opener: function(name) {
				loadSongFile(name);
//				fname = name;
			}
		});
	});
}

class MidiViewer {
  constructor(name) {

	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.homeId = this.idFor(name);
	this.html = filegroup_template({idsuffix: this.idNumber});
	this.undoStack = new UndoStack(10);
  }

  idFor(root) {
	return '#' + root + this.idString;
  }


// At present, our keypress handling is crude. Most keypresses come thru here, even if the focus
// is in other places. We filter-out file browser keypresses, and avoid other problems
// by not using number keys as shortcuts, which stays out of the way of the filter dials.
  handleKeyPress(e)
{
	if (fileBrowserActive()) return; // Mask keys intended for file browser.

	let ch = e.key;
	let chlow = ch.toLowerCase();

	if (chlow === 'u') {
		stepNextAsync(-1);
	} else if (chlow === 'd') {
		stepNextAsync(1);
	}
//	console.log("*** Key down: " + e.keyCode);
}

/*

	$('.upbut').click(e=>{
		stepNextFile(focusMidiView.fname, -1, openMidiFile);
	});
	
	$('.downbut').click(e=>{
		stepNextFile(focusMidiView.fname, 1, openMidiFile);
	});
*/
  bindGui() {
	let me = this;
	let id = this.idFor('butnrow');
	let baseEl = $(id);
/*
	var sfxdd = sfx_dropdn_template();
	new Dropdown(this.idFor('dropdn'), sfxdd, e=>{me.openFilter(e)});
	this.playBtnImg = $('.playbutimg', baseEl);
	this.undoBtn = $('.undobut', baseEl);
	this.redoBtn = $('.redobut', baseEl);
*/
}

  setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

  updateGui()
{


}

  startGuiCheck() {
	let me = this;
 	this.checker = e=>{me.updateGui()};
	if(!this.guiCheck) this.guiCheck = setInterval(this.checker, 200);
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
	this.startGuiCheck();
	// let loadEndTime = performance.now();
	// console.log("Load time: " + (loadEndTime - loadStartTime));
}

// use ajax to load wav data (instead of a web worker).
  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	$("#statind").text("Loading: " +  this.fname);
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		me.setEditData(data);
		$("#statind").text(me.fname + " loaded.");
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

//---------Button-----------


//Save

  saveAs(){
	let me = this;
	let songDoc = getFocusDoc();
	if (!songDoc) return;
	saveFileBrowser({
		initialPath:  songDoc.fname,
		saver: function(name) {
			songDoc.save(name);
		}
	});
}

  openLocal(evt)
 {
 	let me = this;

	if (firstOpened && multiDocs) {
		 that = new MidiViewer('midiview');
		 $('#midiview').append(me.html);
		 me.bindGui();
		 focusMidiView = that;
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
		me.startGuiCheck();
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
	var blob = new Blob([saveXML], {type: "text/plain;charset=utf-8"});
	let saveName;
	if (local_exec) {
		saveName = focusDoc.fname.name 
	} else {
		saveName = focusDoc.fname.split('/').pop();
	}
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
		registerGlobalHandlers();
	}

	if(!local_exec) {
		var urlarg = location.search.substring(1);
		let fname = decodeURI(urlarg);
		homeDoc.loadFile(fname);
	} else { // We are running as a 'file://', so change the GUI to reflect me.
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$('#filegroup2').remove();
		$('#filegroupsong').append(local_exec_song_group());
				
		$(homeDoc.idFor('midiantab')).append (local_exec_info());
		$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	}
	$('#downloadbut').click((e)=>{downloader(e)});
	homeDoc.bindGui();

	createEmptySong();
}

function openMidiFile(fname)
{
	let homeDoc = new MidiViewer('midiview');
	homeDoc.loadFile(fname);
	if(!multiDocs) $('#midiview').empty();
	$('#midiview').append(homeDoc.html);

	homeDoc.bindGui();

	focusMidiView = homeDoc;
}

function setSongText(fname, text)
{
	let focusDoc = makeDelugeDoc(fname, text, false, true);
	setFocusDoc(focusDoc);
}

// use ajax to load xml data (instead of a web worker).
  function loadSongFile(fname)
{
	$("#statind2").text("Loading: " +  fname);
	$.ajax({
	url         : fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		setSongText(fname, data);
		$("#statind2").text(fname + " loaded.");
	},

	error: function (data, textStatus, jqXHR) {
		console.log("Error: " + textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType= 'text';
		return xhr;
	},

	});
}

function createEmptySong()
{
	let data = empty_song_template();
	setSongText("/SONGS/SONG900.XML", data);
}


window.onload = onLoad;
