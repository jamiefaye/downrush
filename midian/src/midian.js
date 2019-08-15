import $ from'jquery';
import {openMidiDoc, setFocusMidiView, setAddToDocFunction, setMpcEnabled, setClipboardEnabled, makeEmptyMidiFile} from './MidiDoc.jsx';
import {openXpjDoc} from "./XpjDoc.jsx";
import {getDropInFS} from "./FileStore.js";

// The following requires cause individual files to be transferred into the build
// directory with renaming if needed.
require('file-loader?name=[name].[ext]!../html/midian.htm');
require('file-loader?name=index.html!../html/index_web.html');
require('file-loader?name=index.htm!../html/index_mpc.html');
require('file-loader?name=xpj2midi.html!../html/xpj2midi.html');
require('file-loader?name=index_xpj.html!../html/index_xpj.html');
require('file-loader?name=xpjview.html!../html/xpjview.html');
require('file-loader?name=[name].[ext]!../css/midian.css');
require('file-loader?name=[name].[ext]!../../xmlView/css/edit.css');
require('file-loader?name=img/[name].[ext]!../img/menu-up.png');

require('file-loader?name=img/[name].[ext]!../img/glyphicons-halflings-72-play.png');
require('file-loader?name=img/[name].[ext]!../img/glyphicons-halflings-74-stop.png');

require('file-loader?name=[name].[ext]!../html/test.html');

import empty_song_template from "./templates/empty_song.handlebars";
import {addTrackToMidi, converter} from "./DelugeToMidi.js";
import {setFocusDoc, makeDelugeDoc, getFocusDoc, pasteTrackJson} from "../../xmlView/src/SongViewLib.js";
import {FileManager} from "./FileManager.js";
import Uppie from './js/uppie.js';


"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;

// cloud_served flag is set if the URL does not contain /DR/, which is a crude
// test for not coming via the FlashAir card.
var cloud_served = document.URL.indexOf('/DR/') === -1;

var activeFileManager;

class MidiViewer {
  constructor(name) {
	this.html = "";
  }


 openOnBuffer(data, fname) {
	if(!this.midiDoc) {
		let midiPlace = $('#midiview');
		this.midiDoc = openMidiDoc(midiPlace[0], fname);
	}
	this.midiDoc.openOnBuffer(data);
 }

}; // ** End of class

class XpjViewer {
  constructor(name) {
	this.html = "";
  }


 openOnBuffer(data, fname) {
	if(!this.midiDoc) {
		let midiPlace = $('#xpjview');
		this.midiDoc = openXpjDoc(midiPlace[0], fname);
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
		load:  function(theData, fname, manager, fromViewer) {
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

	if(!local_exec && !cloud_served) {
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
		load:  function(theData, fname, manager, fromViewer) {
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


function onLoadXpj()
{
	let xpjViewDoc = new XpjViewer('xpjview');

	let xpjFileManager = new FileManager({
		prefix:  "xpj",
		defaultName: "Untitled.xpj",
		defaultDir: "/",
		dataType: "blob",
		load:  function(theData, fname, manager, fromViewer) {
			let homeViewer = new XpjViewer('xpjview');
			manager.homeDoc = homeViewer;
			homeViewer.openOnBuffer(theData, fname);
			$('#xpjview').append(homeViewer.html);
			
		},
		save:  function(manager, fromViewer) {
			return fromViewer.midiDoc.generateMid();
		},
		newCallback: 	null,
		fileExtensions: ["XPJ", "xpj"],
		content_type: "application/zip",
	});

	activeFileManager = xpjFileManager;

//	if(!local_exec && !cloud_served) {

	if(!local_exec) {
		var urlarg = location.search.substring(1);
		if (urlarg && urlarg.toLowerCase().indexOf('.xpj') >0) {
			let fname = decodeURI(urlarg);
			xpjFileManager.initialLoad(fname);
		} else {
			xpjViewDoc.midiDoc = makeEmptyMidiFile($('#xpjview')[0]);
			if (cloud_served) {
				let dropin = getDropInFS();
			}
		}
	} else {
		xpjViewDoc.midiDoc = makeEmptyMidiFile($('#xpjview')[0]);
	}

	xpjFileManager.homeDoc = xpjViewDoc;
	
	
	activeFileManager.prefixId("status").text("Drop files and folders onto this yellow area to make them available to this program.");
}

 function addToDocFunction(jsonTrack) {
 	pasteTrackJson(jsonTrack, getFocusDoc());
 }

 function registerDelugeTrackGUI() { }

if (buildType !== 'mpc') {
	setAddToDocFunction(addToDocFunction);
}

setMpcEnabled(buildType === 'mpc');
setClipboardEnabled(buildType !== 'mpc' && buildType !== 'xpj');

if (buildType === 'xpj') {
	window.onload = onLoadXpj;
} else {
	window.onload = onLoad;
}

let uppie = new Uppie();
let duppy = document.querySelector('#uploader');
if (duppy) {
	uppie(duppy, function (event, formData, files) {
		var flist = [];
		for (var [key, value] of formData.entries()) { if(key === 'files[]') flist.push(value); }

		let dropin = getDropInFS();
		dropin.addFiles(flist);

		if (activeFileManager) {
			activeFileManager.prefixId("status").text("" +  flist.length + " file entries loaded");
		}
	});
}


$("#xpjtestbut").on('click', e=>{
	console.log("Clicked");
	let newWin = window.open("test.html");
});
