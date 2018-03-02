import $ from'./js/jquery-3.2.1.min.js';
import WaveSurfer from './js/wavesurfer.js';
import TimelinePlugin from'./js/plugins/wavesurfer.timeline.js';
import RegionPlugin  from'./js/plugins/wavesurfer.regions.js';
import Minimap from'./js/plugins/wavesurfer.minimap.js';
import knob from'./js/jquery.knob.js';
import {sfx_dropdn_template, quadfilter_template, local_exec_head, local_exec_info} from'./templates.js';
import {TiledRenderer, tiledDrawBuffer} from './js/plugins/wavesurfer.tiledrenderer.js';
import UndoStack from './UndoStack.js';
import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import {audioBufferToWav} from './audioBufferToWav.js';

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

var localClipboard;
var loadStartTime;


var undoStack = new UndoStack(10);

var wavesurfer;

function redrawWave()
{
	wavesurfer.drawBuffer();
	wavesurfer.minimap.render();
}

// Page transition warning

var unexpected_close = true;

//var Microphone = window.WaveSurfer.microphone;
var disableWaveTracker;

function openOnBuffer(decoded)
{
//	var tiledRenderer = new TiledRenderer.default();
	var plugs =  [
		TimelinePlugin.create({
			container: '#waveform-timeline'
			}),
		RegionPlugin.create({
			dragSelection: false,
			}),
			
		Minimap.create({
			container: '#minimap',
			height: 30,
			barHeight: 1.4,
			interact:	true,
			// showOverview: true,
			})
		];

	$('#waveform').empty();
	$('#waveform-timeline').empty();
	$('#minimap').empty();

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
		renderer:		 TiledRenderer,
	//	barWidth:	1,
	});
// Patch in an override to the drawBuffer function.
	wavesurfer.drawBuffer = tiledDrawBuffer;

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

		startGuiCheck();
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
	let regional = false;
	let dur =  wavesurfer.getDuration()
	let endT = dur;
	let progS = wavesurfer.drawer.progress() * endT;
	let region = regionMap[function() { for (var k in regionMap) return k }()];
	let cursorTime = wavesurfer.getCurrentTime();

	if (region && region.start < region.end) {
		startT = region.start;
		endT = region.end;
		regional = true;
	}
	let cursorPos = secondsToSampleNum(cursorTime, buffer);
	let startS = secondsToSampleNum(startT, buffer);
	let endS = secondsToSampleNum(endT, buffer);

	return {
		length: srcLen,
		regional: regional,
		start:	startT,
		end:	endT,
		first:  startS,
		last:	endS,
		progress: progS,
		region: region,
		cursorTime: cursorTime,
		cursorPos: 	cursorPos,
		duration:	dur,
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
	var scroll = wavesurfer.params.scrollParent;
	var scrollSpeed = wavesurfer.params.scrollSpeed || 1;
	var scrollThreshold = wavesurfer.params.scrollThreshold || 10;
	var maxScroll = void 0;
	var scrollDirection = void 0;
	var wrapperRect = void 0;
	var wrapper = wavesurfer.drawer.wrapper;
	var repeater;

	var rangeUpdater = function(e) {
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
	}

	var edgeScroll = function edgeScroll(e) {
		if (!region || !scrollDirection) return;

	// Update scroll position
		var scrollLeft = wrapper.scrollLeft + scrollSpeed * scrollDirection;
		var nextLeft =  Math.min(maxScroll, Math.max(0, scrollLeft));
		wrapper.scrollLeft = scrollLeft = Math.min(maxScroll, Math.max(0, scrollLeft));
		rangeUpdater(e);
		// Check that there is more to scroll and repeat
		if(scrollLeft < maxScroll && scrollLeft > 0) {
			window.requestAnimationFrame(function () {
			edgeScroll(e);
			});
		}
	};

	var eventMove = function (e) {
		if (!dragActive) return;
		rangeUpdater(e);
		// If scrolling is enabled
		if (scroll && wavesurfer.drawer.container.clientWidth < wrapper.scrollWidth) {
			// Check threshold based on mouse
			var x = e.clientX - wrapperRect.left;
			if (x <= scrollThreshold) {
				scrollDirection = -1;
			} else if (x >= wrapperRect.right - scrollThreshold) {
				scrollDirection = 1;
			} else {
				scrollDirection = null;
			}
			scrollDirection && edgeScroll(e);
		}
	}

	var eventUp = function (e) {
		dragActive = false;
		if (region) {
			region.fireEvent('update-end', e);
			wavesurfer.fireEvent('region-update-end', region, e);
		}
		region = null;
		let win = $(window); // disconnect listeners.
		win.off('mousemove', eventMove);
		win.off('touchmove', eventMove);
		win.off('mouseup', eventUp);
		win.off('touchend', eventUp);
	}


	var eventDown = function (e) {
		duration = wavesurfer.getDuration();
		// Filter out events intended for the scroll bar
		let hasScroll = wavesurfer.params.scrollParent;
		let r = e.target.getBoundingClientRect();

		if (hasScroll && e.clientY > (r.bottom - 16)) return; // *** JFF Hack magic number.

		maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
		wrapperRect = wrapper.getBoundingClientRect();

		t0 = wavesurfer.drawer.handleEvent(e);

		let xD = e.clientX;

		if (hasScroll) {
			xD += wrapper.scrollLeft;
		}

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
		let win = $(window);
		win.on('mousemove', eventMove); // dynamic listeners
		win.on('touchmove', eventMove);
		win.on('mouseup', eventUp);
		win.on('touchend', eventUp);
		//console.log('down');
	}

	let waveElem = $('#waveform');

	waveElem.on('mousedown', eventDown);
	waveElem.on('touchstart', eventDown);

	return function() {
		waveElem.off('mousedown', eventDown);
		waveElem.off('touchstart', eventDown);
	 };
}

var createOfflineContext  = function (buffer) {
	let {numberOfChannels, sampleRate} = buffer;
	return new OfflineContext(numberOfChannels, buffer.getChannelData(0).length, sampleRate);
}

function secondsToSampleNum(t, buffer) {
	let sn = t * buffer.sampleRate;
	if (sn < 0) return 0;
	if (sn > buffer.getChannelData(0).length) return buffer.getChannelData(0).length
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

// disconnectFilters
// setFilters (listoffilters);
var testFilterButton = function(e)
{
	let biquadFilter = wavesurfer.backend.ac.createBiquadFilter();
	let filterGUI = quadfilter_template();
	$('#procmods').empty();
	wavesurfer.backend.setFilters();
	$('#procmods').append (filterGUI);
	$(".dial").knob({change: function (v) {
		let inp = this.i[0];
		let ctlId = inp.getAttribute('id').substring(3);
//		if (ctlId === 'gain') {
//			biquadFilter.gain.value = v;
//		} else {
			biquadFilter[ctlId].value = v;
//		}
//		console.log(ctlId + " " + v);
	}  });
	$('#qf_type').change( e=> {
		let picked = $("select option:selected" )[0];
		let fkind = $(picked).text();
		biquadFilter.type = fkind;
		//console.log($(picked).text());
	});
	$('#fl_cancel').on('click', e=>{
		$('#procmods').empty();
		wavesurfer.backend.setFilters();
	});

	$('#fl_audition').on('click', e=>{
		if (e.target.checked) {
			wavesurfer.backend.setFilters([biquadFilter]);
		} else {
			wavesurfer.backend.setFilters();
		}
	});

	$('#fl_apply').on('click', e=>{
		$('#fl_audition').prop('checked', false);
		applyFilterTransform(function (ctx) {
			let bqf = ctx.createBiquadFilter();
			bqf.type = biquadFilter.type;
			bqf.frequency.value = biquadFilter.frequency.value;
			bqf.detune.value = biquadFilter.detune.value;
			bqf.Q.value = biquadFilter.Q.value;
			bqf.gain.value = biquadFilter.gain.value;
			return [bqf];
		});

		wavesurfer.backend.setFilters();
	});
	wavesurfer.backend.setFilters([biquadFilter]);
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

	ctx.oncomplete = function (e) {
		pasteSelected(e.renderedBuffer);
	}
	ctx.startRendering();
/*
	ctx.startRendering().then(function(renderedBuffer) {
		pasteSelected(renderedBuffer);
	}).catch(function(err) {
		alert('Rendering failed: ' + err);
	});
*/
}

function testOfflineContext(e) {
	applyFilterTransform(testFilterGraph);
}

// Simplified to just multiply by 1/max(abs(buffer))
// (which preserves any existing DC offset).
var normalize = function (buffer)
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
		if (songPos < 0) songPos = 0;
		let dur = wavesurfer.getDuration();
		if (songPos < dur) {
			wavesurfer.play(songPos);
			console.log('playing');
		}
	}
}

function doPlaySel(e)
{
	let buffer = wavesurfer.backend.buffer;
	let {start, end} = getSelection(buffer);
	wavesurfer.play(start, end);
}


var deleteSelected = function (e)
{
	let buffer = wavesurfer.backend.buffer;
	let {regional, length, first, last, region} = getSelection(buffer);
	if (!regional) return;

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

function reverser(e) {
	applyTransform(reverse);
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

function selAll(e) {
	let {regional, start, end, duration} = getSelection(wavesurfer.backend.buffer);
	wavesurfer.regions.clear();
	wavesurfer.seekTo(0);
	// If wa are alread a full selection, quit right after we cleared.
	if (regional && start === 0 && end === duration) return;

	let pos = {
		start:	0,
		end:	wavesurfer.getDuration(),
		drag:	false,
		resize: false,
	};
	wavesurfer.regions.add(pos);
}


var pasteSelected = function (pasteData, checkInsert)
{
	let buffer = wavesurfer.backend.buffer;

	let {regional, cursorTime, cursorPos, length, first, last, region} = getSelection(buffer);

	if (checkInsert && !regional) { // regionl === false means its an insertion point.
		first = cursorPos;
		last = cursorPos;
	}

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

function copyToClip(e) 
{
	let clip = e.originalEvent.clipboardData;

	let clipBuff =  copySelected();
	let wavData = audioBufferToWav(clipBuff);
	let asText = base64ArrayBuffer(wavData);
	localClipboard = clipBuff;
	if (clip) clip.setData('text/plain', asText);
	e.preventDefault();
}

function cutToClip(e) {
	copyToClip(e);
	deleteSelected(e);
}

function pasteFromClip(e)
{
	let clipBd = e.originalEvent.clipboardData;
	if (clipBd) {
		let clip = clipBd.getData('text/plain');
		if (clip.startsWith('Ukl')) {
			let asbin = base64ToArrayBuffer(clip);
			wavesurfer.backend.decodeArrayBuffer(asbin, function (data) {
			if (data) pasteSelected(data, true);
	 	  }, function (err) {
			alert('paste decode error');
		  });
		  return;
		}
	}
	if (localClipboard) pasteSelected(localClipboard, true);
}

function zoom(amt) {
	
	let minPxWas = wavesurfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 44100;
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	wavesurfer.zoom(newPx);
}

function bindGui() {
	$(window).on('paste', pasteFromClip);
	// iOS was screwing up if the following line was not commented out.
	$(window).on('copy', copyToClip);
	$(window).on('cut', cutToClip);
	
	$(window).on('undo', doUndo);
	$(window).on('redo', doRedo);
	// Remove highlighting after button pushes:
	$('.butn').mouseup(function() { this.blur()});
	
	$('#loadbut').on('click',btn_load);
	$('#savebut').on('click',btn_save);
	$('#plsybut').on('click',(e)=>{wavesurfer.playPause(e)});
	$('#rewbut').on('click', (e)=>{wavesurfer.seekTo(0)});
	$('#plsyselbut').on('click', doPlaySel);
	$('#undobut').on('click', doUndo);
	$('#redobut').on('click', doRedo);
	$('#delbut').on('click', deleteSelected);
	$('#cutbut').on('click', cutToClip);
	$('#copybut').on('click', copyToClip);
	$('#pastebut').on('click',pasteFromClip);
	$('#normbut').on('click',normalizer);
	$('#reversebut').on('click',reverser);
	$('#fadeinbut').on('click',fadeIn);
	$('#fadeoutbut').on('click',fadeOut);
	$('#selallbut').on('click',selAll);
	$('#zoominbut').on('click',e=>{zoom(2.0)});
	$('#zoomoutbut').on('click',e=>{zoom(0.5)});
}

var sfxdd = sfx_dropdn_template();
$('#dropdn').append(sfxdd);
$('#dropbtn').on('click', function (e) {
	console.log('clicked!');
	$('#droplist').toggleClass('show');
});

$('#openfilter').on('click', e=>{openFilter('filter')});

function closeDropDown() {
	$(".dropdown-content").removeClass('show');
}


function openFilter(filterName) {
	closeDropDown();
	if (filterName === 'filter') {
		testFilterButton();
	}
}

/*
$(function() {
	$(".dial").knob();
});
*/

var playBtnImg = $('#playbutimg');
var undoBtn = $('#undobut');
var redoBtn = $('#redobut');

function setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

function updateGui()
{
	if(!wavesurfer) return;
	let playState = wavesurfer.isPlaying();

	let newPlayImg = "img/glyphicons-174-play.png"
	if (playState) newPlayImg = "img/glyphicons-175-pause.png";
	if (playBtnImg.attr('src') !== newPlayImg) {
		playBtnImg.attr('src',newPlayImg);
	}

	let canUndo = undoStack.canUndo();
	setDisable(undoBtn, !canUndo);

	let canRedo = undoStack.canRedo();
	setDisable(redoBtn, !canRedo);
}

var guiCheck;

function startGuiCheck() {
	if(!guiCheck) guiCheck = setInterval(updateGui, 200);
}

/*
// Chrome decided to only allow the browser access to the microphone when the page has been served-up via https
// since the FlashAir card doesn't do that, we can't record audio. Another annoying browser incapacity.
function record()
{
	var mike = new Microphone({}, wavesurfer);

	mike.start();
}
*/

// data = DOMException: Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).


//editor
function setEditData(data)
{
	openOnBuffer(data);
	
	let loadEndTime = performance.now();
	console.log("Load time: " + (loadEndTime - loadStartTime));
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
		loadFile();
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
	bindGui();
}

window.onload = onLoad;




// use ajax to load wav data, instead of web worker.
function loadFile()
{
	loadStartTime = performance.now();
	fname = filename_input.value;
	$("#statind").text("Loading: " +  fname);
	$.ajax({
	url         : fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		setEditData(data);
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

// use ajax to save-back wav data, instead of web worker.
function saveFile(filepath, data)
{
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
					$("#statind").text(filepath + " saved.");
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

//Load
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		// postWorker("load"); // 4306
		loadFile();
		fname = filename_input.value;

//	}
	// jsEditor.markClean();
}

//Save

function btn_save(){

	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it?\n(Target file name has changed!)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	let aBuf = wavesurfer.backend.buffer;
	let saveData = audioBufferToWav(aBuf);
	saveFile(fname, saveData);
	// jsEditor.markClean();
}
