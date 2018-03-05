import $ from'./js/jquery-3.2.1.min.js';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import {reverb_template} from'./templates.js';

export default class SimpleReverbFilter extends FilterBase {
  constructor() {
	super(reverb_template);
	this.reverse = 0;
	this.seconds = 3;
	this.decay = 2;
	this.drylevel = 5;
	this.wetlevel = 5;
  }

  createFilters(ctx) {
 	this.dryGain = ctx.createGain();
 	this.dryGain.gain.value = 0.5;
 	this.wetGain = ctx.createGain();
 	this.wetGain.gain.value = 0.5;
	this.convolver = ctx.createConvolver();
	this.ctx = ctx;
	this.buildImpulse();
  }

  connectFilters(source, dest) {
		this.source = source;
		this.dest = dest;
		
		this.source.connect(this.dryGain);
		this.source.connect(this.convolver);
		this.dryGain.connect(this.dest);
		this.convolver.connect(this.wetGain);
		this.wetGain.connect(this.dest);
  }

  disconnectFilters() {
		this.dryGain.disconnect();
		this.wetGain.disconnect();
		this.convolver.disconnect();
		this.source.disconnect();

		// Reconnect the direct path
		this.source.connect(this.dest);
  }

  getState() {
	  return {
		seconds: 	this.seconds,
		decay:		this.decay,
		reverse:	this.reverse,
		drylevel:	this.drylevel,
		wetlevel:	this.wetlevel,
	  };
	}

  applyState(state) {
		this.seconds = state.seconds;
		this.decay = state.decay;
		this.reverse = state.reverse;
		this.drylevel = state.drylevel;
		this.dryGain.gain.value = state.drylevel / 10;
		this.wetGain.gain.value = state.wetlevel / 10;
		this.buildImpulse();
	}

  buildImpulse () {
	let rate = this.ctx.sampleRate;
	let length = rate * this.seconds
	let decay = this.decay
	let impulse = this.ctx.createBuffer(2, length, rate)
	let impulseL = impulse.getChannelData(0);
	let impulseR = impulse.getChannelData(1);

	for (let i = 0; i < length; i++) {
		let n = this.reverse ? length - i : i;
		impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
		impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
	 }
	this.convolver.buffer = impulse;
	this.convolver.normalize = true;
  }

  openGui(whereToPut) {
		super.openGui(whereToPut);
		let that = this;
		$(".dial").knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('id').substring(3);
			that[ctlId] = v;
			if (ctlId === 'drylevel') {
				that.dryGain.gain.value = v / 10;
			} else if (ctlId === 'wetlevel') {
				that.wetGain.gain.value = v / 10;
			} else {
				that.buildImpulse();
			}
		}});
  }
};

