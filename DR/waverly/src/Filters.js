import $ from'./js/jquery-3.2.1.min.js';
import {filter_frame_template, quadfilter_template} from'./templates.js';
import {OfflineContext} from './AudioCtx.js';
import Dropdown from './Dropdown.js';

var createOfflineContext  = function (buffer) {
	let {numberOfChannels, sampleRate} = buffer;
	return new OfflineContext(numberOfChannels, buffer.getChannelData(0).length, sampleRate);
}

function connectChain(source, ctx, filters)
{
	let prevFilter = source;
	if (filters) {
		for (var i = 0; i < filters.length; ++i) {
			let thisFilter = filters[i];
			prevFilter.connect(thisFilter);
			prevFilter = thisFilter;
		}
	}
	prevFilter.connect(ctx.destination);
}

// Abstract super class for a filter object.
class FilterBase {
	constructor(template) {
		this.template = template;
	}

	openGui(whereToPut) {
		$(whereToPut).append (this.template());
	}

	// Get the current state of all the filter parameters.
	getState() {
		return {};
	}

	// Set the state of the filter parameters to the filter chain
	applyState(state) {
		
	}

	makeFilterChain(ctx) {
		return [];
	}
};

class BiQuadFilter extends FilterBase {

	constructor() {
		super(quadfilter_template);
	}

	getState() {
	  return {
		type: 		this.biquadFilter.type,
		frequency: 	this.biquadFilter.frequency.value,
		Q:			this.biquadFilter.Q.value,
		gain:		this.biquadFilter.gain.value,
	  };
	}

	applyState(state) {
		this.biquadFilter.type = state.type;
		this.biquadFilter.frequency.value = state.frequency;
		this.biquadFilter.Q.value = state.Q;
		this.biquadFilter.gain.value = state.gain;
	}

	makeFilterChain(ctx) {
		this.biquadFilter = ctx.createBiquadFilter();
		this.filterChain = [this.biquadFilter];
		return this.filterChain;
	}

	openGui(whereToPut) {
		super.openGui(whereToPut);
		let that = this;
		let filterDrop = new Dropdown('#quaddropdn',undefined,function (e) {
			let targID = e.target.getAttribute('id');
			let targText = e.target.innerText;
			let fname = targID.substring(3);
			that.biquadFilter.type = fname;
			let namef = $('#quaddropdn');
			$(namef[0].firstChild).text(targText);
		});

		$(".dial").knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('id').substring(3);
			that.biquadFilter[ctlId].value = v;
		}});
	}
};


class FilterFrame {
  constructor(wave, updateFunc) {
		this.wave = wave;
		this.updateFunc = updateFunc;
  }

  buildLive() {
	this.liveFilters = this.filter.makeFilterChain(this.wave.audioContext);
  }

  setFilters(toArray) {
	this.wave.backend.setFilters(toArray);
  }

  open(filterClass) {
		this.filterClass = filterClass;
		this.filter = new filterClass();
		$('#procmods').empty();
		let frameText = filter_frame_template();
		$('#procmods').append(frameText);
		this.setFilters();
		this.buildLive();
		this.filter.openGui('#filterbody');
		this.setFilters(this.liveFilters);
		this.openGui();
	}

	openGui() {
	$('#fl_cancel').on('click', e=>{
		this.setFilters();
		$('#procmods').empty();
	});

	$('#fl_audition').on('click', e=>{
		if (e.target.checked) {
			this.setFilters(this.liveFilters);
		} else {
			this.setFilters();
		}
	});

	$('#fl_apply').on('click', e=>{
		$('#fl_audition').prop('checked', false);
		this.applyFilters();
		this.setFilters();
	});
  }

  applyFilters() {
	let working = this.wave.copySelected();
	let ctx = createOfflineContext(working);

	// create offline version of filter chain.
	let offlineFilter = new this.filterClass();
	let offlineChain = offlineFilter.makeFilterChain(ctx);

	let source = ctx.createBufferSource();
	connectChain(source, ctx, offlineChain);

	let state = this.filter.getState();
	offlineFilter.applyState(state);

	source.buffer = working;
	let that = this;
	ctx.oncomplete = function (e) {
		that.wave.pasteSelected(e.renderedBuffer);
	}
	source.start();
	ctx.startRendering();
  }

};

export {FilterBase, BiQuadFilter, FilterFrame};
