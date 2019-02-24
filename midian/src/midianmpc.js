import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc, setFocusMidiView, setAddToDocFunction, setMpcEnabled} from './MidiDoc.jsx';
require('file-loader?name=index.html!../html/index_mpc.html');
require('file-loader?name=[name].[ext]!../css/midian.css');
import filegroup_template from "./templates/filegroup_template.handlebars";
import FileSaver from 'file-saver';

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = true;
var sample_path_prefix = '/';

// Used to enable 'multiple samples open on one page'.
var multiDocs = false;

var gIdCounter = 0;

var focusMidiView;
var firstOpened = false;


function registerGlobalHandlers() {
	$('.openmidibutn').click(e=>{openMidiFileDialog(e)});
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

  setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

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


	 // We are running as a 'file://', so change the GUI to reflect me.
	$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	homeDoc.bindGui();

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

setMpcEnabled(true);
 
window.onload = onLoad;
