import $ from'./js/jquery-3.2.1.min.js';
import Wave from './Wave.js';
require('file-loader?name=[name].[ext]!../viewWAV.htm');
import {sfx_dropdn_template, local_exec_head, local_exec_info} from'./templates.js';

import UndoStack from './UndoStack.js';
import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import {audioBufferToWav} from './audioBufferToWav.js';
import Dropdown from './Dropdown.js';
import {audioCtx, OfflineContext} from './AudioCtx.js';
import {FilterFrame} from './Filters.js';
import BiQuadFilter from './BiquadFilter.js';
import SimpleReverbFilter from './SimplereverbFilter.js';
import DelayFilter from './DelayFilter.js';
import OscFilter from './OscFilter.js';

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;

var sample_path_prefix = '/';

var fname = "";

var localClipboard;

var wave;

// Simplified to just multiply by 1/max(abs(buffer))
// (which preserves any existing DC offset).
function normalize(buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			let s = d[i];
			if (s < 0) s = -s;
			if (s > maxv) maxv = s;
		}
		if (maxv === 0) return;
		let scaler = 1.0 / maxv;
		for (var i = 0; i < d.length; ++i) {
			d[i] = d[i]* scaler;
		}
	}

	return buffer;
}

function reverse (buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;
	let halfbuf = bufLen / 2;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let d = buffer.getChannelData(cx);
		let td = bufLen - 1;
		for (var i = 0; i < halfbuf; ++i) {
			let s = d[i];
			d[i] = d[td];
			d[td--] = s;
		}
	}

	return buffer;
}

function applyFunction (buffer, f)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var minv = 1000000;
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			d[i] = f(d[i], i, bufLen);
		}
	}

	return buffer;
}


class WaveViewer {

  constructor(homeId) {
	this.homeId = homeId;
	this.undoStack = new UndoStack(10);;
  }

 openFilter(e)
{
	if (this.filterFrame) {
		this.filterFrame.close();
	}

	this.filterFrame = new FilterFrame(this.wave, this.undoStack);
	let targID = e.target.getAttribute('data-id');
	let classToMake;
	if (targID === 'openfilter') classToMake = BiQuadFilter;
	 else if (targID === 'openReverb') classToMake = SimpleReverbFilter;
	 else if (targID === 'openDelay') classToMake = DelayFilter;
	 else if (targID === 'openOsc') classToMake = OscFilter;
	this.filterFrame.open(classToMake);
}


 doPlaySel(e)
{
	let {start, end} = this.wave.getSelection(true);
	this.wave.surfer.play(start, end);
}


  deleteSelected(e)
{
	let buffer = this.wave.backend.buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = length - ds;
	if (bufLen === 0) bufLen = 1;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = 0; i < first; ++i) {
			da[dx++] = sa[i];
		}
		for(var i = last; i < length; ++i) {
			da[dx++] = sa[i];
		}
	}
	if(region) region.remove();
	this.undoStack.push(buffer);
	this.wave.changeBuffer(nextBuffer);
}

   cropToSel (e) {
	let buffer = this.wave.backend.buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let bufLen = last - first;
	let {numberOfChannels, sampleRate} = buffer;

	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = first; i < last; ++i) {
			da[dx++] = sa[i];
		}
	}
	if(region) region.remove();
	this.wave.surfer.seekTo(0);
	this.undoStack.push(buffer);
	this.wave.changeBuffer(nextBuffer);
  }

// Adjust the selection so that it trims to zero crossings
 trimtozero() {
	let buffer = this.wave.backend.buffer;
	let {sampleRate} = buffer;
	let {insertionPoint, length, first, last, region} = this.wave.getSelection(false);
	if (insertionPoint) return;

	let sa = buffer.getChannelData(0);

	while (sa[first] === 0.0 && first < last) first++;
	last--;
	while (sa[last] === 0.0 && first < last) last--;
	let lsgn = Math.sign(sa[first]);
	if(last < first) return;
	let newL = first;
	for (var i = first + 1; i <= last; ++i) {
		if(Math.sign(sa[i]) != lsgn) {
			newL = i;
			break;
		}
	}

	let newR = last;
	let rsgn = Math.sign(sa[newR]);
	for (var i = last - 1; i >= first; i--) {
		if(Math.sign(sa[i]) != rsgn) {
			newR = i + 1;
			break;
		}
	}
	this.wave.setSelection(newL / sampleRate, newR / sampleRate);
}

// Apply a transform function to the selected area and replace the selected area
// with the result. The transform function can be either 'in place' or can return a
// result buffer of any size.
 applyTransform(f, f2)
{
	let working = this.wave.copySelected();
	let result = f(working, f2);

	this.undoStack.push(this.wave.pasteSelected(result));
}

  reverser(e) {
	this.applyTransform(reverse);
}

  normalizer(e) {
	
	this.applyTransform(normalize);
}

  fadeIn(e) {
	
	let f = function (s, i, len) {
		return s * (i / len);
	}
	this.applyTransform(applyFunction, f);
}

  fadeOut(e) {
	
	let f = function (s, i, len) {
		return s * (1.0 - i / len);
	}
	this.applyTransform(applyFunction, f);
}

  selAll(e) {
	let {insertionPoint, start, end, duration} = this.wave.getSelection(false);
	this.wave.surfer.regions.clear();
	this.wave.surfer.seekTo(0);
	// If wa are alread a full selection, quit right after we cleared.
	if (!insertionPoint && start === 0 && end === duration) return;

	let pos = {
		start:	0,
		end:	this.wave.surfer.getDuration(),
		drag:	false,
		resize: false,
	};
	this.wave.surfer.regions.add(pos);
}

  doUndo(e) {
	console.log("Undo");

	if (this.undoStack.atTop()) {
		let buffer = this.wave.backend.buffer;
		this.undoStack.push(buffer);
	}
	let unbuf = this.undoStack.undo();
	this.wave.changeBuffer(unbuf);
}

  doRedo(e) {
	console.log("Redo");
	let redo = this.undoStack.redo();
	this.wave.changeBuffer(redo);
}

   copyToClip(e) 
{
	let clip = e.originalEvent.clipboardData;

	let clipBuff = this.wave.copySelected();
	let wavData = audioBufferToWav(clipBuff);
	let asText = base64ArrayBuffer(wavData);
	localClipboard = clipBuff;
	if (clip) clip.setData('text/plain', asText);
	e.preventDefault();
}

   cutToClip(e) {
	this.copyToClip(e);
	this.deleteSelected(e);
}

  pasteFromClip(e)
 {
	let clipBd = e.originalEvent.clipboardData;
	if (clipBd) {
		let clip = clipBd.getData('text/plain');
		if (clip.startsWith('Ukl')) {
			let asbin = base64ToArrayBuffer(clip);
			this.wave.backend.decodeArrayBuffer(asbin, function (data) {
			if (data) this.undoStack.push(this.wave.pasteSelected(data, true));
	 	  }, function (err) {
			alert('paste decode error');
		  });
		  return;
		}
	}
	if (localClipboard) {
		this.undoStack.push(this.wave.pasteSelected(localClipboard, true));
	}
 }

  zoom(amt) {
	
	let minPxWas = this.wave.surfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 192000;
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	this.wave.surfer.zoom(newPx);
}

  bindGui() {
	let that = this;
	$(window).on('paste', e=>{that.pasteFromClip(e)});
	// iOS was screwing up if the following line was not commented out.
	$(window).on('copy', e=>{that.copyToClip(e)});
	$(window).on('cut', e=>{that.cutToClip(e)});

	$(window).on('undo', e=>{that.doUndo(e)});
	$(window).on('redo', e=>{that.doRedo(e)});
	// Remove highlighting after button pushes:
	//$('.butn').mouseup(e=>{e.target.blur()});

	$('#loadbut').click(e=>{that.btn_load(e)});
	$('#savebut').click(e=>{that.btn_save(e)});

	$('#plsybut').click(e=>{that.wave.surfer.playPause(e)});
	$('#rewbut').click( e=>{that.wave.surfer.seekTo(0)});
	$('#plsyselbut').click(e=>{that.doPlaySel(e)});
	$('#undobut').click(e=>{that.doUndo(e)});
	$('#redobut').click(e=>{that.doRedo(e)});
	$('#delbut').click(e=>{that.deleteSelected(e)});
	$('#cutbut').click(e=>{that.cutToClip(e)});
	$('#copybut').click(e=>{that.copyToClip(e)});

	$('#pastebut').click(e=>{that.pasteFromClip(e)});
	$('#normbut').click(e=>{that.normalizer(e)});
	$('#reversebut').click(e=>{that.reverser(e)});
	$('#fadeinbut').click(e=>{that.fadeIn(e)});
	$('#fadeoutbut').click(e=>{that.fadeOut(e)});
	$('#selallbut').click(e=>{that.selAll(e)});
	$('#zoominbut').click(e=>{that.zoom(2.0)});
	$('#zoomoutbut').click(e=>{that.zoom(0.5)});
	$('#trimbut').click(e=>{that.trimtozero(e)});
	$('#cropbut').click(e=>{that.cropToSel(e)});

	var sfxdd = sfx_dropdn_template();
	new Dropdown('#dropdn', sfxdd, e=>{that.openFilter(e)});
	this.playBtnImg = $('#playbutimg');
	this.undoBtn = $('#undobut');
	this.redoBtn = $('#redobut');
}

  setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

  updateGui()
{
	if(!this.wave || !this.wave.surfer) return;
	let playState = this.wave.surfer.isPlaying();

	let newPlayImg = "img/glyphicons-174-play.png"
	if (playState) newPlayImg = "img/glyphicons-175-pause.png";
	if (this.playBtnImg.attr('src') !== newPlayImg) {
		this.playBtnImg.attr('src',newPlayImg);
	}

	let canUndo = this.undoStack.canUndo();
	this.setDisable(this.undoBtn, !canUndo);

	let canRedo = this.undoStack.canRedo();
	this.setDisable(this.redoBtn, !canRedo);
}


  startGuiCheck() {
	if(!this.guiCheck) this.guiCheck = setInterval(()=>{this.updateGui()}, 200);
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
	if(!this.wave) {
		this.wave = new Wave('#waveform');
	}
	this.wave.openOnBuffer(data);
	this.startGuiCheck();
	// let loadEndTime = performance.now();
	// console.log("Load time: " + (loadEndTime - loadStartTime));
}

  openLocal(evt)
{
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var reader = new FileReader();
	if(!this.wave) {
		this.wave = new Wave('#waveform');
	}
// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		return this.wave.openOnBuffer(theFile);
	})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
}



// use ajax to load wav data (instead of a web worker).
  loadFile()
{
	this.fname = this.filename_input.value;
	let that = this;
	$("#statind").text("Loading: " +  fname);
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		that.setEditData(data);
		$("#statind").text(fname + " loaded.");
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

// use ajax to save-back wav data (instead of a web worker).
  saveFile(filepath, data)
{
	let that = this;
	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&TIME="+(Date.now());;
	$.get(urlDateSet, function() {
		$.ajax(filepath, {
		headers:	{'Overwrite': 't', 'Content-type': 'audio/wav'},
		cache:		false,
		contentType: false,
		data:		data,
		processData : false,
		method:		'PUT',
		error:		function(jqXHR, textStatus, errorThrown) {
			alert(textStatus + "\n" + errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			console.log("Save OK");
			$.ajax("/upload.cgi?WRITEPROTECT=OFF",{
				error:	function(jqXHR, textStatus, errorThrown) {
					alert(textStatus + "\n" + errorThrown);
				},
				headers: {"If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"},
				success: function(data, textStatus, jqXHR){
					console.log("save and unlock done");
					$("#statind").text(that.filepath + " saved.");
				},
			})
		},
		
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
		  	xhr.upload.addEventListener("progress", function(evt){
			  if (evt.lengthComputable) {
				  var percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				  //Do something with upload progress
				 $("#statind").text(filepath + " " + percentComplete + "%");
				 //console.log(percentComplete);
			  }
			}, false);
		 	return xhr;
		 }
		});
	});
}

//---------Button-----------

//Load
  btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		// postWorker("load"); // 4306
		this.loadFile();
		this.fname = this.filename_input.value;

//	}
	// jsEditor.markClean();
}

//Save

  btn_save(){

	if(this.fname != this.filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it?\n(Target file name has changed!)'))
		{
			return;
		}
	}
	this.fname = this.filename_input.value;

	let aBuf = this.wave.backend.buffer;
	let saveData = audioBufferToWav(aBuf);
	this.saveFile(fname, saveData);
	// jsEditor.markClean();
}

  openLocal(evt)
 {
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var reader = new FileReader();
	if(!this.wave) {
		this.wave = new Wave('#waveform');
	}
	let that = this;
// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		return that.wave.openOnBuffer(theFile);
	})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
 }


}; // ** End of class

//.value

//---------- When reading page -------------
function onLoad()
{
	let homeDoc = new WaveViewer($('#wavegroup'));
	var filenameel = document.getElementById ("fname");
	homeDoc.filename_input = filenameel;
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		homeDoc.filename_input.value = decodeURI(urlarg);
	}

	if(!local_exec) {
		homeDoc.loadFile();
	} else { // We are running as a 'file://', so change the GUI to reflect that.
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$('#jtab').append (local_exec_info());
		$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	}
	homeDoc.bindGui();
}

window.onload = onLoad;
