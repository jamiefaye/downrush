import $ from'./js/jquery-3.2.1.min.js';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import {delay_template} from'./templates.js';
import Dropdown from './Dropdown.js';


export default class DelayFilter extends FilterBase {
  constructor() {
	super(delay_template);
	this.type = 'normal';
	this.delayTime = 1.0;
	this.cutoff = 8000;
	this.offset = 0;
	this.filterSetup = false;
  }

  createFilters(ctx) {
  	this.ctx = ctx;

	this.split = ctx.createChannelSplitter(2);
	this.merge = ctx.createChannelMerger(2);
	this.leftDelay = ctx.createDelay();
	this.rightDelay = ctx.createDelay();
	this.leftGain = ctx.createGain();
	this.rightGain = ctx.createGain();
	this.leftFilter = ctx.createBiquadFilter()
	this.rightFilter = ctx.createBiquadFilter();
	this.dryGain = ctx.createGain();

	this.leftFilter.type = 'lowpass';
	this.leftFilter.frequency.value  = this.cutoff;
	this.rightFilter.type = 'lowpass';
	this.rightFilter.frequency.value  = this.cutoff;

	this.leftDelay.delayTime.value = this.delayTime;
	this.rightDelay.delayTime.value = this.delayTime;
	this.leftGain.gain.value = 0.5;
	this.rightGain.gain.value = 0.5;
	
	this.setOffset(this.offset);
  }

  connectFilters(source, dest) {
	this.source = source;
	this.dest = dest;
 	this.source.connect(this.split);
 	if (!this.filterSetup) {
 		this.filterSetup = true;
		this.leftDelay.connect(this.leftGain);
		this.rightDelay.connect(this.rightGain);
		this.leftGain.connect(this.leftFilter);
		this.rightGain.connect(this.rightFilter);
	}
	this.merge.connect(this.dest);

	this.repatch();

	this.source.connect(this.dryGain);
	this.dryGain.connect(this.dest);

  }

  disconnectFilters() {
	// Isolate our filters from player.
	this.source.disconnect();
	this.merge.disconnect();
	// Reconnect the direct path
	this.source.connect(this.dest);
  }

  getState() {
	  return {		
		type:		this.type,
		delay:		this.delayTime,
		feedback:	this.leftGain.gain.value,
		cutoff:		this.leftFilter.frequency.value,
		offset:		this.offset,
		dry:		this.dryGain.gain.value,
	  };
	}

  applyState(state) {
		this.type = state.type;
		this.delayTime = state.delay;
		this.leftDelay.delayTime.value = this.delayTime;
		this.rightDelay.delayTime.value = this.delayTime;
		this.leftGain.gain.setValueAtTime(state.feedback, 0);
		this.rightGain.gain.setValueAtTime(state.feedback, 0);
		this.leftFilter.frequency.value = state.cutoff;
		this.rightFilter.frequency.value = state.cutoff;
		this.cutoff = state.cutoff;
		this.setOffset(state.offset);
		this.dryGain.gain.value = state.dry;

		this.repatch();
	}

	openGui(whereToPut) {
		super.openGui(whereToPut);
		let that = this;
		let delayDrop = new Dropdown('#delaydropdn',undefined,function (e) {
			let targID = e.target.getAttribute('id');
			let targText = e.target.innerText;
			let fname = targID.substring(3);
			that.type = fname;
			that.repatch();
			let namef = $('#delaydropdn');
			$(namef[0].firstChild).text(targText);
		});

		$(".dial").knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('id').substring(3);
			that[ctlId] = v;

			switch (ctlId) {
		case 'delay':
			that.delayTime = v;
			that.setOffset(that.offset);
			break;

		case 'feedback':
			that.leftGain.gain.setValueAtTime(v, 0);
			that.rightGain.gain.setValueAtTime(v, 0);
			break;

		case 'cutoff':
			that.leftFilter.frequency.value = v;
			that.rightFilter.frequency.value = v;
			that.cutoff = v;
			break;

		case 'offset':
			that.setOffset(v);
			break;

		case 'dry':
			that.dryGain.gain.value = v;
			break;
		  } // End of switch
		}});
	}

  setOffset (value) {
	var offsetTime = this.delayTime + value;
	this.offset = value;
	if (value < 0) {
		this.leftDelay.delayTime.setValueAtTime(offsetTime, 0);
		this.rightDelay.delayTime.setValueAtTime(this.delayTime, 0);
	} else {
		this.leftDelay.delayTime.setValueAtTime(this.delayTime, 0);
		this.rightDelay.delayTime.setValueAtTime(offsetTime, 0);
	 }
 }

  repatch() {
	this.split.disconnect();
	this.leftFilter.disconnect();
	this.rightFilter.disconnect();
	this.leftFilter.connect(this.merge, 0, 0);
	this.rightFilter.connect(this.merge, 0, 1);
	
	if (this.type === 'normal') {
		this.split.connect(this.leftDelay, 0);
		this.split.connect(this.rightDelay, 1);
		this.leftFilter.connect(this.leftDelay);
		this.rightFilter.connect(this.rightDelay);
	}
	 else if (this.type === 'inverted') {
		this.split.connect(this.leftDelay, 1);
		this.split.connect(this.rightDelay, 0);
		this.leftFilter.connect(this.leftDelay);
		this.rightFilter.connect(this.rightDelay);
	}
	 else if (this.type === 'pingpong') {
		this.split.connect(this.leftDelay, 0);
		this.split.connect(this.rightDelay, 1);
		this.leftFilter.connect(this.rightDelay);
		this.rightFilter.connect(this.leftDelay);
	}
  }

};
