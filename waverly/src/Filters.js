import $ from'jquery';
import filter_frame_template from'./templates/filter_frame_template.handlebars';
import {OfflineContext} from './AudioCtx.js';

var createOfflineContext  = function (buffer) {
	let {numberOfChannels, sampleRate} = buffer;
	return new OfflineContext(numberOfChannels, buffer.getChannelData(0).length, sampleRate);
}

// Abstract super class for a filter object.
class FilterBase {
	constructor(template) {
		this.template = template;
	}

	openGui(whereToPut) {
		this.rootElm = $(whereToPut);
		this.rootElm.append (this.template());
	}

	// Get the current state of all the filter parameters.
	getState() {
		return {};
	}

	// Set the state of the filter parameters to the filter chain
	applyState(state) {
		
	}

	createFilters(ctx) {
		this.filters = [];
	}

	connectFilters(source, dest) {
		this.source = source;
		this.dest = dest;
		if(this.filters) {
			let prevFilter = source;
			for (var i = 0; i < this.filters.length; ++i) {
				let thisFilter = this.filters[i];
				prevFilter.connect(thisFilter);
				prevFilter = thisFilter;
			}
			prevFilter.connect(dest);
		}
	}

	disconnectFilters() {
		if (this.filters) {
			this.filters.forEach(function (filter) {
				filter && filter.disconnect();
			});
		}
		// Reconnect the direct path
		this.source.connect(this.dest);
	}

	getGeneratedDuration() {
		return 0;
	}
};

class FilterFrame {
  constructor(rootID, wave, undoStack) {
		this.rootElem = $(rootID);
		this.wave = wave;
		this.undoStack = undoStack;
  }

  close() {
	if(this.filter) {
		this.filter.disconnectFilters();
		this.filter = undefined;
	}
  }

  connectToWave() {
	this.wave.backend.analyser.disconnect();
	this.filter.connectFilters(this.wave.backend.analyser, this.wave.backend.gainNode);
  }


  open(filterClass) {
		this.filterClass = filterClass;
		this.filter = new filterClass();
		this.rootElem.empty();
		let frameText = filter_frame_template();
		this.rootElem.append(frameText);
		this.filter.createFilters(this.wave.audioContext);
		let filterBodyPlace = this.rootElem.find('.filterbody');
		this.filter.openGui(filterBodyPlace);
		this.connectToWave()
		this.openGui();
	}

	openGui() {
	let me = this;
	$('.fl_cancel', this.rootElem).on('click', e=>{
		me.connectToWave();
		if(me.filter) {
			me.filter.disconnectFilters();
		}
		me.rootElem.empty();
	});

	$('.fl_audition', this.rootElem).on('click', e=>{
		if (e.target.checked) {
			me.connectToWave();
		} else {
			me.filter.disconnectFilters();
		}
	});

	$('.fl_apply', this.rootElem).on('click', e=>{
		$('.fl_audition', me.rootElem).prop('checked', false);
		me.applyFilters();
		me.filter.disconnectFilters();
	});
  }

  applyFilters() {
  	let generatedDuration = this.filter.getGeneratedDuration();
  	
	let working;
	
	if (generatedDuration === 0) {
		working = this.wave.copySelected(true);
	} else {
		working = this.wave.getBufferOfLength(generatedDuration);
	}
	let ctx = createOfflineContext(working);

	// create offline version of filter chain.
	let offlineFilter = new this.filterClass();
	offlineFilter.createFilters(ctx);

	// Create simulated wavesurfer filter environment.
	let offlineSource = ctx.createBufferSource();
	offlineFilter.connectFilters(offlineSource, ctx.destination);

	let state = this.filter.getState();
	offlineFilter.applyState(state);

	offlineSource.buffer = working;
	let me = this;
	ctx.oncomplete = function (e) {
		let previous = me.wave.pasteSelected(e.renderedBuffer, generatedDuration > 0);
		me.undoStack.push(previous);
	}
	offlineSource.start();
	ctx.startRendering();
  }

};

export {FilterBase, FilterFrame};
