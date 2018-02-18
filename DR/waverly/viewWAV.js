"use strict";

// Change the following line as needed to point to the parent directory containing your sample directory.
// If you leave it undefined, our code will make an informed guess as to where your samples are located.
// You probably don't need to change it.
var custom_sample_path = undefined;

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;

var sample_path_prefix = '/';
var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;

var fname = "";

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;


class UndoStack {
	constructor() {
		this.stack = [];
		this.index = -1;
	}
	
	atTop() {
		return this.index === -1;
	}

	push(item) {
		if (this.index >= 0) {
			while (this.index < this.stack.length) this.stack.pop();
			this.index = -1;
		}
		this.stack.push(item);
	}

	undo() {
		if (this.stack.length === 0) return undefined;
		if (this.index === -1) { // start one behind the redo buffer
			this.index = this.stack.length - 1;
		}
		if (this.index > 0) this.index--;
		let v = this.stack[this.index];
		return v;
	}

	redo() {
		if (this.stack.length === 0 || this.index === -1) return undefined;
		let nextX = this.index + 1;
		if (nextX >= this.stack.length) return undefined;
		this.index = nextX;
		return this.stack[this.index];
	}
};

var undoStack = new UndoStack();

/*
var pushBuffer = function ()
{
	let buffer = wavesurfer.backend.buffer;
	let srcLen = buffer.getChannelData(0).length;
	let {numberOfChannels, sampleRate} = buffer;
	let saveBuffer = audioCtx.createBuffer(numberOfChannels, srcLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		for(var i = 0; i < last; ++i) {
			da[i] = sa[i];
		}
	}

	return nextBuffer;
}
*/

// Trigger redraw of song
function triggerRedraw() {
	$('#jtab').empty();
	// jsonToTopTable(jsonDocument, $('#jtab'));
}

function redrawWave()
{
	//wavesurfer.peakCache.clearPeakCache();
	wavesurfer.drawBuffer();
}


// Page transition warning

var unexpected_close = true;

var wavesurfer;
var TimelinePlugin = window.WaveSurfer.timeline;
var RegionPlugin = window.WaveSurfer.regions;

var disableWaveTracker;

function openOnBuffer(decoded)
{
	var plugs =  [
		TimelinePlugin.create({
			container: '#waveform-timeline'
			}),
		RegionPlugin.create({
				dragSelection: false,
			}),
		];

	$('#waveform').empty();
	$('#waveform-timeline').empty();

	wavesurfer = WaveSurfer.create({
		container:		'#waveform',
		waveColor:		'violet',
		progressColor:	'purple',
		splitChannels:	true,
		interact:		false,
		fillParent:		false,
		scrollParent:	true,
		plugins:		plugs,
		partialRender:  false,
	});

	wavesurfer.loadBlob(decoded);

	wavesurfer.on('ready', function () {
		let buf = wavesurfer.backend.buffer;
		let dat = buf.getChannelData(0);
		
		let dur = wavesurfer.getDuration();
		let w = wavesurfer.drawer.getWidth();
		if (dur !== 0) {
			let pps = w / dur * 0.9;
			wavesurfer.zoom(pps);
		}
		disableWaveTracker = setupWaveTracker();
});	

/*
	var slider = document.querySelector('#slider');

	slider.oninput = function () {
		var zoomLevel = Number(slider.value);
		console.log(zoomLevel);
		wavesurfer.zoom(zoomLevel);
	};
*/
}

function getSelection() {
	let buffer = wavesurfer.backend.buffer;
	let srcLen = buffer.getChannelData(0).length;
	let regionMap = wavesurfer.regions.list;
	
	let startT = 0;
	let all = true;
	let endT = wavesurfer.getDuration();
	let progS = wavesurfer.drawer.progress() * endT;
	let region = regionMap[function() { for (var k in regionMap) return k }()];

	if (region && region.start < region.end) {
		startT = region.start;
		endT = region.end;
		all = false;
	}

	let startS = secondsToSampleNum(startT, buffer);
	let endS = secondsToSampleNum(endT, buffer);

	return {
		length: srcLen,
		all:	all,
		start:	startT,
		end:	endT,
		first:  startS,
		last:	endS,
		progress: progS,
		region: region,
	};
}

function seekCursorTo(e) {
	let progress = wavesurfer.drawer.handleEvent(e);
	wavesurfer.seekTo(progress);
}

function setupWaveTracker() {
	var region;
	var dragActive;
	var t0;
	var t1;
	var duration;
	
	var eventDown = function (e) {
		duration = wavesurfer.getDuration();

		t0 = wavesurfer.drawer.handleEvent(e);
		t1 = t0;
		if (wavesurfer.isPlaying()) {
			dragActive = false;
			seekCursorTo(e);
		} else {
			dragActive = true;
			wavesurfer.regions.clear();
			wavesurfer.seekTo(t0);
			let pos = {
				start:	t0 * duration,
				end:	t1 * duration,
				drag:	false,
				resize: false,
			};
			region = wavesurfer.regions.add(pos);
		}
		//console.log('down');
	}

	var eventMove = function (e) {
		if (!dragActive) return;
		t1 = wavesurfer.drawer.handleEvent(e);
		let tS = t0;
		let tE = t1;
		if (t1 < t0) {
			tS = t1;
			tE = t0;
			wavesurfer.seekTo(t1);
		}
		region.update({
			start:	tS * duration,
			end:	tE * duration
		});
		//console.log('move');
	}

	var eventUp = function (e) {
		dragActive = false;
		if (region) {
			region.fireEvent('update-end', e);
			wavesurfer.fireEvent('region-update-end', region, e);
		}
		region = null;
	}

	let waveElem = $('#waveform');
	waveElem.on('mousedown', eventDown);
	waveElem.on('touchstart', eventDown);
	waveElem.on('mousemove', eventMove);
	waveElem.on('touchmove', eventMove);
	waveElem.on('mouseup', eventUp);
	waveElem.on('touchend', eventUp);

	return function() {
		waveElem.off('mousedown', eventDown);
		waveElem.off('touchstart', eventDown);
		waveElem.off('mousemove', eventMove);
		waveElem.off('touchmove', eventMove);
		waveElem.off('mouseup', eventUp);
		waveElem.off('touchend', eventUp);
	 };
}

var createOfflineContext  = function (buffer) {
	let {numberOfChannels, sampleRate} = buffer;
	return new OfflineContext(numberOfChannels, buffer.getChannelData(0).length, sampleRate);
}

function secondsToSampleNum(t, buffer) {
	let sn = t * buffer.sampleRate;
	if (sn < 0) return 0;
	if (sn > buffer.getChannelData(0).length) return getChannelData(0).length
	return Math.round(sn);
}


var testFilterGraph = function (ctx)
{
	//set up the different audio nodes we will use for the app
	let analyser = ctx.createAnalyser();
	let distortion = ctx.createWaveShaper();
	let gainNode = ctx.createGain();
	let biquadFilter = ctx.createBiquadFilter();
	let convolver = ctx.createConvolver();

	biquadFilter.type = "lowshelf";
	biquadFilter.frequency.value = 1000; //.setValueAtTime(1000, ctx.currentTime);
	biquadFilter.gain.value = 25; // .setValueAtTime(25, ctx.currentTime);

	let filtList = [analyser, distortion, biquadFilter, gainNode];
	return filtList;
}

// Apply a filter transform implemented using the AudioContext filter system to the selected area
// and paste back the result.
// the setup function is called to knit together the filter graph desired.
function applyFilterTransform(setup)
{
	let working = copySelected();
	let ctx = createOfflineContext(working);
	
	let filters;
	
	if (setup !== undefined) {
		filters = setup(ctx, working);
	} 
	
	let source = ctx.createBufferSource();

	// Connect all filters in the filter chain.
	let prevFilter = source;
	if (filters) {
		for (var i = 0; i < filters.length; ++i) {
			let thisFilter = filters[i];
			prevFilter.connect(thisFilter);
			prevFilter = thisFilter;
		}
	}
	prevFilter.connect(ctx.destination);

	source.buffer = working;
	source.start();

	ctx.startRendering().then(function(renderedBuffer) {
		pasteSelected(renderedBuffer);
	}).catch(function(err) {
		alert('Rendering failed: ' + err);
	});
}

function testOfflineContext(e) {
	applyFilterTransform(testFilterGraph);
}

var normalize = function (buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var minv = 1000000;
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			let s = d[i];
			if (s < minv) minv = s;
			 else if (s > maxv) maxv = s;
		}
		let dcoff = (maxv + minv) / 2;
		let oldRange = maxv - minv;
		if (oldRange < 0.0001) continue;
		let scaler = 2.0 / oldRange;
		for (var i = 0; i < d.length; ++i) {
			d[i] = (d[i] - dcoff) * scaler;
		}
	}

	return buffer;
}

var applyFunction = function (buffer, f)
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


function changeBuffer(buffer) {
	if (!buffer) return;

	let playState = wavesurfer.isPlaying();
	let songPos;
	if (playState) {
		console.log('pausing');
		wavesurfer.pause();
		songPos = wavesurfer.getCurrentTime();
	}

	wavesurfer.backend.load(buffer);
	redrawWave();
	if (playState) {
		wavesurfer.play(songPos);
		console.log('playing');
	}
}


var deleteSelected = function (e)
{
	let buffer = wavesurfer.backend.buffer;
	let {all, length, first, last, region} = getSelection(buffer);
	if (all) return;

	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = length - ds;
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
	undoStack.push(buffer);
	changeBuffer(nextBuffer);
}

var copySelected = function (e)
{
	let buffer = wavesurfer.backend.buffer;
	let {length, first, last, region} = getSelection(buffer);
	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, ds, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = first; i < last; ++i) {
			da[dx++] = sa[i];
		}
	}
	return nextBuffer;
}

// Apply a transform function to the selected area and replace the selected area
// with the result. The transform function can be either 'in place' or can return a
// result buffer of any size.
function applyTransform(f, f2)
{
	let working = copySelected();
	let result = f(working, f2);
	pasteSelected(result);
}


function normalizer(e) {
	
	applyTransform(normalize);
}

function fadeIn(e) {
	
	let f = function (s, i, len) {
		return s * (i / len);
	}
	applyTransform(applyFunction, f);
}

function fadeOut(e) {
	
	let f = function (s, i, len) {
		return s * (1.0 - i / len);
	}
	applyTransform(applyFunction, f);
}


var pasteSelected = function (pasteData)
{
	let buffer = wavesurfer.backend.buffer;

	let {length, first, last, region} = getSelection(buffer);

	let pasteLen = pasteData.getChannelData(0).length;
	let dTs = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let numPasteChannels = pasteData.numberOfChannels;
	let bufLen = length - dTs + pasteLen;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let pdx = cx < numPasteChannels ? cx : 0;
		let cb = pasteData.getChannelData(pdx);
		let dx = 0;
		for(var i = 0; i < first; ++i) {
			da[dx++] = sa[i];
		}

		for(var i = 0; i < pasteLen; ++i) {
			da[dx++] = cb[i];
		}

		for(var i = last; i < length; ++i) {
			da[dx++] = sa[i];
		}
	}
	//if(region) region.remove();
	undoStack.push(buffer);
	changeBuffer(nextBuffer);
}


function doUndo(e) {
	console.log("Undo");

	if (undoStack.atTop()) {
		let buffer = wavesurfer.backend.buffer;
		undoStack.push(buffer);
	}
	let unbuf = undoStack.undo();
	changeBuffer(unbuf);
}

function doRedo(e) {
	console.log("Redo");
	let redo = undoStack.redo();
	changeBuffer(redo);
}


function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}

function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function copyToClip(e) 
{
	let clip = e.originalEvent.clipboardData;
	let clipBuff =  copySelected();
	let wavData = audioBufferToWav(clipBuff);
	let asText = base64ArrayBuffer(wavData);
	clip.setData('text/plain', asText);
	e.preventDefault();
}

// Populate copy to clip board button.
var clipper = new Clipboard('.copycb', {
	text: function(trigger) {
		let clipBuff =  copySelected();
		let wavData = audioBufferToWav(clipBuff);
		let asText = base64ArrayBuffer(wavData);
		// alert(asText);
		return asText;
		}
});




function cutToClip(e) {
	copyToClip(e);
	deleteSelected(e);
}

function pasteFromClip(e)
{
	let clip = e.originalEvent.clipboardData.getData('text/plain');
	let asbin = base64ToArrayBuffer(clip);
	wavesurfer.backend.decodeArrayBuffer(asbin, function (data) {
		pasteSelected(data);
	 }, function (err) {
		console.log('paste decode error');
	 });
}

$(window).on('paste', pasteFromClip);
// iOS was screwing up if the following line was not commented out.
$(window).on('copy', copyToClip);
$(window).on('cut', cutToClip);

$(window).on('undo', doUndo);
$(window).on('redo', doRedo);
// Remove highlighting after button pushes:
$('.butn').mouseup(function() { this.blur()});

function zoom(amt) {
	
	let minPxWas = wavesurfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	wavesurfer.zoom(newPx);
}

/*
$('#paster').on('paste', pasteFromClip);
*/
//editor
function setEditData(data)
{
	openOnBuffer(data);
}

function openLocal(evt)
{
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var reader = new FileReader();
	
// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		return openOnBuffer(theFile);
	/*
		return function(e) {
			// Display contents of file
				let buffer = e.target.result;
				openOnBuffer(buffer);
			//	audioCtx.decodeAudioData(buffer).then(function (decoded) {
			//		openOnbuffer(decoded);
			//	});
			};
			*/
		})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
}



//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		filename_input.value = decodeURI(urlarg);
	}

	if(!local_exec) {
		postWorker("load");
		fname = filename_input.value;
	} else {
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$('#jtab').append (local_exec_info());
		$('#opener').on('change', openLocal);
		if (custom_sample_path) {
			sample_path_prefix = custom_sample_path;
		} else {
			if (document.URL.indexOf('DR/xmlView')> 0) {
				sample_path_prefix = '../../';
			} else if (document.URL.indexOf('xmlView')> 0) {
				sample_path_prefix = '../';
			} else sample_path_prefix = '';
		}
	}
}
window.onload = onLoad;



// Snarfed from: https://github.com/Jam3/audiobuffer-to-wav/blob/master/index.js
function audioBufferToWav (buffer, opt) {
  opt = opt || {}

  let {numberOfChannels, sampleRate} = buffer;
  var format = opt.float32 ? 3 : 1
  var bitDepth = format === 3 ? 32 : 16

  var result
  if (numberOfChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
  } else {
    result = buffer.getChannelData(0)
  }

  return encodeWAV(result, format, sampleRate, numberOfChannels, bitDepth)
}

function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
  var bytesPerSample = bitDepth / 8
  var blockAlign = numChannels * bytesPerSample

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  var view = new DataView(buffer)

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, format, true)
  /* channel count */
  view.setUint16(22, numChannels, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true)
  /* bits per sample */
  view.setUint16(34, bitDepth, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true)
  if (format === 1) { // Raw PCM
    floatTo16BitPCM(view, 44, samples)
  } else {
    writeFloat32(view, 44, samples)
  }

  return buffer
}

function interleave (inputL, inputR) {
  var length = inputL.length + inputR.length
  var result = new Float32Array(length)

  var index = 0
  var inputIndex = 0

  while (index < length) {
    result[index++] = inputL[inputIndex]
    result[index++] = inputR[inputIndex]
    inputIndex++
  }
  return result
}

function writeFloat32 (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true)
  }
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}



//-------keyin--------
document.onkeydown = function (e){
	if(!e) e = window.event;

	if(e.keyCode == 112) //F1
	{
		btn_save();
		return false;		
	}

	if(e.keyCode == 123) //F12
	{
		btn_load();
		return false;		
	}
};



//---------Button-----------

//CONFIG
function btn_config()
{
//	if(window.confirm('Load /SD_WLAN/CONFIG?'))
//	{
		filename_input.value="/SD_WLAN/CONFIG";
		postWorker("load");
//	}
}

//Load
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		postWorker("load");
		fname = filename_input.value;
//	}
	// jsEditor.markClean();
}

//Save

function btn_save(){

	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("save");
	// jsEditor.markClean();
}

//---------handler-----------

var status_str="";
//status
function clrStat()
{
	status_str="";
	stat_output.value = status_str;
}

// add one line to status
function addStat(x)
{
	status_str += "\n" + x;
	stat_output.value = status_str;
	stat_output.scrollTop = stat_output.scrollHeight;
}

//Worker
function postWorker(mode)
{
	var saveData  = "";
	if(mode === 'save') {
		let aBuf = wavesurfer.backend.buffer;
		saveData = audioBufferToWav(aBuf);
	}

	var msg = {
		filepath: filename_input.value,
		arg: "", // arg_input.value,
		mode: mode,
		edit: saveData,
	};
	worker.postMessage(msg);
}

//------------Worker---------------
if (!local_exec && !window.Worker) {
	alert("Web Worker disabled! Editor won't work!")
}

var worker;

if (!local_exec) {
try {
	worker = new Worker("WAVworker.js");
}catch (e) {
	addStat("Exception!(UI): "+e.message);
}
worker.onmessage = function(e) {
	// RPC outfitting

	//debug
	if(e.data.func == "console.log")
	{
		console.log(e.data.arg);
	}
	if(e.data.func == "clearStatus")
	{
		clrStat();
	}
	if(e.data.func == "addStatus" || e.data.func == "setResponse")
	{
		addStat(e.data.arg);
	}
	if(e.data.func == "setEditor")
	{
		setEditData(e.data.arg);
	}
};

}
