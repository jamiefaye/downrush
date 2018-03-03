import $ from'./js/jquery-3.2.1.min.js';
import WaveSurfer from './js/wavesurfer.js';
import TimelinePlugin from'./js/plugins/wavesurfer.timeline.js';
import RegionPlugin  from'./js/plugins/wavesurfer.regions.js';
import Minimap from'./js/plugins/wavesurfer.minimap.js';
import {TiledRenderer, tiledDrawBuffer} from './js/plugins/wavesurfer.tiledrenderer.js';

function secondsToSampleNum(t, buffer) {
	let sn = t * buffer.sampleRate;
	if (sn < 0) return 0;
	if (sn > buffer.getChannelData(0).length) return buffer.getChannelData(0).length
	return Math.round(sn);
}

export default class Wave {
	constructor(rootDivId) {
		this.rootDivId = rootDivId;
	}

	redrawWave()
	{
		this.surfer.drawBuffer();
		this.surfer.minimap.render();
	}

	openOnBuffer(decoded) {
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

	this.surfer = WaveSurfer.create({
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
		// barWidth:		1,
	});
// Patch in an override to the drawBuffer function.
	this.surfer.drawBuffer = tiledDrawBuffer;

	this.surfer.loadBlob(decoded);

// Expose some wavesurfer objects:
	this.backend = this.surfer.backend;
	this.audioContext = this.surfer.backend.ac;

	let that = this;
	this.surfer.on('ready', function () {
		let buf = that.surfer.backend.buffer;
		let dat = buf.getChannelData(0);
		
		let dur = that.surfer.getDuration();
		let w = that.surfer.drawer.getWidth();
		if (dur !== 0) {
			let pps = w / dur * 0.9;
			that.surfer.zoom(pps);
		}
		that.disableWaveTracker = that.setupWaveTracker();

		// that.startGuiCheck();
	})
}	

  getSelection() {
	let buffer = this.surfer.backend.buffer;
	let srcLen = buffer.getChannelData(0).length;
	let regionMap = this.surfer.regions.list;
	
	let startT = 0;
	let regional = false;
	let dur =  this.surfer.getDuration()
	let endT = dur;
	let progS = this.surfer.drawer.progress() * endT;
	let region = regionMap[function() { for (var k in regionMap) return k }()];
	let cursorTime = this.surfer.getCurrentTime();

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

  setupWaveTracker() {
	var region;
	var dragActive;
	var t0;
	var t1;
	var duration;
	var scroll = this.surfer.params.scrollParent;
	var scrollSpeed = this.surfer.params.scrollSpeed || 1;
	var scrollThreshold = this.surfer.params.scrollThreshold || 10;
	var maxScroll = void 0;
	var scrollDirection = void 0;
	var wrapperRect = void 0;
	var wrapper = this.surfer.drawer.wrapper;
	var repeater;
	
	var that = this;

	var rangeUpdater = function(e) {
		t1 = that.surfer.drawer.handleEvent(e);
		let tS = t0;
		let tE = t1;
		if (t1 < t0) {
			tS = t1;
			tE = t0;
			that.surfer.seekTo(t1);
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
		if (scroll && that.surfer.drawer.container.clientWidth < wrapper.scrollWidth) {
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
			that.surfer.fireEvent('region-update-end', region, e);
		}
		region = null;
		let win = $(window); // disconnect listeners.
		win.off('mousemove', eventMove);
		win.off('touchmove', eventMove);
		win.off('mouseup', eventUp);
		win.off('touchend', eventUp);
	}


	var eventDown = function (e) {
		duration = that.surfer.getDuration();
		// Filter out events intended for the scroll bar
		let hasScroll = that.surfer.params.scrollParent;
		let r = e.target.getBoundingClientRect();

		if (hasScroll && e.clientY > (r.bottom - 16)) return; // *** JFF Hack magic number.

		maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
		wrapperRect = wrapper.getBoundingClientRect();

		t0 = that.surfer.drawer.handleEvent(e);

		let xD = e.clientX;

		if (hasScroll) {
			xD += wrapper.scrollLeft;
		}

		t1 = t0;
		if (that.surfer.isPlaying()) {
			dragActive = false;
			let progress = that.surfer.drawer.handleEvent(e);
			that.surfer.seekTo(progress);
		} else {
			dragActive = true;
			that.surfer.regions.clear();
			that.surfer.seekTo(t0);
			let pos = {
				start:	t0 * duration,
				end:	t1 * duration,
				drag:	false,
				resize: false,
			};
			region = that.surfer.regions.add(pos);
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

  changeBuffer(buffer) {
	if (!buffer) return;

	let playState = this.surfer.isPlaying();
	let songPos;
	if (playState) {
		console.log('pausing');
		this.surfer.pause();
		songPos = this.surfer.getCurrentTime();
	}

	this.backend.load(buffer);
	this.redrawWave();
	if (playState) {
		if (songPos < 0) songPos = 0;
		let dur = this.surfer.getDuration();
		if (songPos < dur) {
			this.surfer.play(songPos);
			console.log('playing');
		}
	}
}


} // End class

export {Wave};
