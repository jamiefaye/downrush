import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc, setFocusMidiView, setAddToDocFunction, setMpcEnabled, setClipboardEnabled, makeEmptyMidiFile} from './MidiDoc.jsx';

require('file-loader?name=[name].[ext]!../html/midian.htm');
require('file-loader?name=index.html!../html/index_web.html');
require('file-loader?name=index.htm!../html/index_mpc.html');
require('file-loader?name=[name].[ext]!../css/midian.css');
require('file-loader?name=[name].[ext]!../../xmlView/css/edit.css');
require('file-loader?name=img/[name].[ext]!../img/menu-up.png');

import empty_song_template from "./templates/empty_song.handlebars";
import deluge_track_header_template from "./templates/deluge_track_header_template.handlebars";
import {addTrackToMidi} from "./DelugeToMidi.js";
import {setFocusDoc, makeDelugeDoc, getFocusDoc, pasteTrackJson, registerCallbacks} from "../../xmlView/src/SongViewLib.js";
import {FileManager} from "./FileManager.js";

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0 || buildType !='flashair';

var focusMidiView;

class MidiViewer {
  constructor(name) {
	this.html = "";
  }

//Save
 openOnBuffer(data, fname) {
	if(!this.midiDoc) {
		let midiPlace = $('#midiview');
		this.midiDoc = openMidiDoc(midiPlace[0], fname);
	}
	this.midiDoc.openOnBuffer(data);
 }

}; // ** End of class



function onLoad()
{
	let midiViewDoc = new MidiViewer('midiview');
	focusMidiView = midiViewDoc;
	let midiFileManager = new FileManager({
		prefix:  "midi",
		defaultName: "Untitled.mid",
		defaultDir: "/",
		dataType: "blob",
		load:  function(theData, fname, manager, fromViewer) { // (theData, fname, me, me.midiViewDoc);
			let homeViewer = new MidiViewer('midiview');
			focusMidiView = homeViewer;
			manager.midiViewDoc = homeViewer;
			homeViewer.openOnBuffer(theData, fname);
			$('#midiview').append(homeViewer.html);
			
		},
		save:  function(manager, fromViewer) {
			return fromViewer.midiDoc.generateMid();
		},
		newCallback: 	null,
		fileExtensions: ["MID", "mid"],
		content_type: "audio/midi",
	});

	if(!local_exec) {
		var urlarg = location.search.substring(1);
		if (urlarg && urlarg.toLowerCase().indexOf('.mid') >0) {
			let fname = decodeURI(urlarg);
			midiFileManager.initialLoad(fname);
		} else {
			midiViewDoc.midiDoc = makeEmptyMidiFile($('#midiview')[0]);
		}
	} else {
		midiViewDoc.midiDoc = makeEmptyMidiFile($('#midiview')[0]);
	}

	midiFileManager.homeDoc = midiViewDoc;
	let songManager = new FileManager({
		prefix:  "song",
		defaultName: "SONG.XML",
		defaultDir: "/SONGS/",
		dataType: "text",
		load:  function(theData, fname, manager, fromViewer) { // (theData, fname, me, me.homeDoc); constructor(fname, text, newKitFlag, simple) 
			let homeViewer = makeDelugeDoc(fname, theData, false, true);
			setFocusDoc(homeViewer);
			manager.homeDoc = homeViewer;
			$('#songview').append(homeViewer.html);
			// registerDelugeTrackGUI()
		},
		save:  function(manager, fromViewer) {
			return fromViewer.genDocXMLString();
		},
		newCallback: 	null,
		fileExtensions: ["XML", "xml"],
		content_type: "text/xml;charset=utf-8",
	});
	if (buildType !== 'mpc') {
		let data = empty_song_template();
		let homeSong = makeDelugeDoc("SONG.XML", data, false, true);
		songManager.homeDoc = homeSong;
		setFocusDoc(homeSong);
	}
}

 function addToDocFunction(jsonTrack) {
 	pasteTrackJson(jsonTrack, getFocusDoc());
 }

 function registerDelugeTrackGUI() {
	$(".add2midi").click((e)=>{
		let el =  $(e.target).closest('.add2midi')[0];
		let trackNum = Number(el.dataset.tracknum);
		let fromSong = getFocusDoc();
		addTrackToMidi(focusMidiView.midiDoc, fromSong.jsonDocument.song, trackNum);
		focusMidiView.midiDoc.render();
	});
}

if (buildType !== 'mpc') {
	setAddToDocFunction(addToDocFunction);
}
registerCallbacks(registerDelugeTrackGUI, deluge_track_header_template);
setMpcEnabled(buildType === 'mpc');
setClipboardEnabled(buildType !== 'mpc');

window.onload = onLoad;
