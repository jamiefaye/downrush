import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc, setFocusMidiView, setAddToDocFunction, setMpcEnabled, setClipboardEnabled, makeEmptyMidiFile} from './MidiDoc.jsx';

require('file-loader?name=[name].[ext]!../html/midian.htm');
require('file-loader?name=index.html!../html/index_web.html');
require('file-loader?name=index.htm!../html/index_mpc.html');
require('file-loader?name=[name].[ext]!../css/midian.css');
require('file-loader?name=[name].[ext]!../../xmlView/css/edit.css');
require('file-loader?name=img/[name].[ext]!../img/menu-up.png');

import empty_song_template from "./templates/empty_song.handlebars";
import {addTrackToMidi, converter} from "./DelugeToMidi.js";
import {setFocusDoc, makeDelugeDoc, getFocusDoc, pasteTrackJson} from "../../xmlView/src/SongViewLib.js";
import {FileManager} from "./FileManager.js";

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0 || buildType !='flashair';

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

	let midiFileManager = new FileManager({
		prefix:  "midi",
		defaultName: "Untitled.mid",
		defaultDir: "/",
		dataType: "blob",
		load:  function(theData, fname, manager, fromViewer) { // (theData, fname, me, me.midiViewDoc);
			let homeViewer = new MidiViewer('midiview');
			manager.homeDoc = homeViewer;
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

	function transTrackToMidi(song, trackNum, selt0, selt1) {
		if(selt0 >= selt1) {
			selt0 = 0;
			selt1 = 0;
		}

		console.log("t0: " + selt0 + " t1: " + selt1);
		let mDoc = midiFileManager.homeDoc.midiDoc;
		addTrackToMidi(mDoc, song, trackNum + 1, -selt0, selt0, selt1);
		mDoc.render();
	}

	let songManager = new FileManager({
		prefix:  "song",
		defaultName: "/SONGS/SONG.XML",
		defaultDir: "/SONGS/",
		dataType: "text",
		load:  function(theData, fname, manager, fromViewer) { // (theData, fname, me, me.homeDoc); constructor(fname, text, newKitFlag, simple) 
			let homeViewer = makeDelugeDoc(fname, theData, {transTrack: transTrackToMidi});
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
		let homeSong = makeDelugeDoc("SONG.XML", data, {transTrack: transTrackToMidi, viewer: 'midian'});
		songManager.homeDoc = homeSong;
		setFocusDoc(homeSong);
	}

	$('#songconvert').click((e)=>{
		// function delugeToMidiArranged(midiDoc, song) {
		let fromSong = getFocusDoc();
		let mDoc = midiFileManager.homeDoc.midiDoc;
		converter(mDoc, fromSong.jsonDocument.song);
		mDoc.render();
	});
}

 function addToDocFunction(jsonTrack) {
 	pasteTrackJson(jsonTrack, getFocusDoc());
 }

 function registerDelugeTrackGUI() { }

if (buildType !== 'mpc') {
	setAddToDocFunction(addToDocFunction);
}

setMpcEnabled(buildType === 'mpc');
setClipboardEnabled(buildType !== 'mpc');

window.onload = onLoad;
