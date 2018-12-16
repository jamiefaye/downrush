import $ from'./js/jquery-3.2.1.min.js';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import delay_template from'./templates/delay_template.handlebars';
import Dropdown from './Dropdown.js';


export default class DelayFilter extends FilterBase {
  constructor() {
	super(delay_template);
	this.type = 'normal';
	this.delayTime = 1.0;
	this.cutoff = 8000;
	this.offset = 0;
	this.filterSetup = false;
	this.maxDelayLen = 2.0;
	this.timeConstant = 0.016;
  }

  createFilters(ctx) {
  	this.ctx = ctx;

	this.split = ctx.createChannelSplitter(2);
	this.merge = ctx.createChannelMerger(2);
	this.leftDelay = ctx.createDelay(this.maxDelayLen);
	this.rightDelay = ctx.createDelay(this.maxDelayLen);
	this.leftGain = ctx.createGain();
	this.rightGain = ctx.createGain();
	this.leftFilter = ctx.createBiquadFilter()
	this.rightFilter = ctx.createBiquadFilter();
	this.dryGain = ctx.createGain();

	this.leftFilter.type = 'lowpass';
	this.leftFilter.frequency.setTargetAtTime(this.cutoff, 0, 0);
	this.rightFilter.type = 'lowpass';
	this.rightFilter.frequency.setTargetAtTime(this.cutoff, 0, 0);
	this.leftDelay.delayTime.setTargetAtTime(this.delayTime, 0, 0);
	this.rightDelay.delayTime.setTargetAtTime(this.delayTime, 0, 0);
	this.leftGain.gain.setTargetAtTime( 0.5, 0, 0);
	this.rightGain.gain.setTargetAtTime(0.5, 0, 0);
	
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
		this.leftDelay.delayTime.setTargetAtTime(this.delayTime, 0, 0);
		this.rightDelay.delayTime.setTargetAtTime(this.delayTime ,0, 0);
		this.leftGain.gain.setTargetAtTime(state.feedback, 0, 0);
		this.rightGain.gain.setTargetAtTime(state.feedback, 0, 0);
		this.leftFilter.frequency.setTargetAtTime(state.cutoff, 0, 0);
		this.rightFilter.frequency.setTargetAtTime(state.cutoff, 0, 0);
		this.cutoff = state.cutoff;
		this.setOffset(state.offset);
		this.dryGain.gain.value = state.dry;

		this.repatch();
	}

	openGui(whereToPut) {
		super.openGui(whereToPut);
		let me = this;
		let delayDrop = new Dropdown($('.delaydropdn', this.rootElem),undefined,function (e) {
			let targID = e.target.getAttribute('data-id');
			let targText = e.target.innerText;
			let fname = targID;
			me.type = fname;
			me.repatch();
			let namef = $('.delaydropdn', this.rootElem);
			$(namef[0].firstChild).text(targText);
		});

		$(".dial", this.rootElem).knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('data-id');
			me[ctlId] = v;

			switch (ctlId) {
		case 'delay':
			me.delayTime = v;
			me.setOffset(me.offset);
			break;

		case 'feedback':
			me.leftGain.gain.setTargetAtTime(v, 0, me.timeConstant);
			me.rightGain.gain.setTargetAtTime(v, 0, me.timeConstant);
			break;

		case 'cutoff':
			me.leftFilter.frequency.setTargetAtTime(v, 0, me.timeConstant);
			me.rightFilter.frequency.setTargetAtTime(v, 0, me.timeConstant);
			me.cutoff = v;
			break;

		case 'offset':
			me.setOffset(v);
			break;

		case 'dry':
			me.dryGain.gain.setTargetAtTime(v, 0, me.timeConstant);
			break;
		  } // End of switch
		}});
	}

  clipMD(value) {
  	if (value < 0) value = 0;
  	 else if (value > this.maxDelayLen) value = this.maxDelayLen;
  	return value;
  }

  setOffset (value) {
	var offsetTime = this.delayTime + value;
	this.offset = value;
	if (value < 0) {
		this.leftDelay.delayTime.setTargetAtTime(this.clipMD(offsetTime), 0, this.timeConstant);
		this.rightDelay.delayTime.setTargetAtTime(this.clipMD(this.delayTime), 0, this.timeConstant);
	} else {
		this.leftDelay.delayTime.setTargetAtTime(this.clipMD(this.delayTime), 0, this.timeConstant);
		this.rightDelay.delayTime.setTargetAtTime(this.clipMD(offsetTime), 0, this.timeConstant);
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
