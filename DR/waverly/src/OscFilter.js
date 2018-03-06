import $ from'./js/jquery-3.2.1.min.js';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import {osc_template} from'./templates.js';
import Dropdown from './Dropdown.js';

export default class OscFilter extends FilterBase {
	constructor() {
		super(osc_template);
		this.duration = 0;
		this.started = false;
	}

	getState() {
	  return {
		type: 		this.oscFilter.type,
		frequency: 	this.oscFilter.frequency.value,
		gain:		this.gainNode.gain.value,
		duration:	this.duration,
	  };
	}

	applyState(state) {
		this.oscFilter.type = state.type;
		this.oscFilter.frequency.value = state.frequency;
		this.gainNode.gain.value = state.gain;
		this.duration = state.duration;
	}

	connectFilters(source, dest) {
		this.source = source;
		this.dest = dest;
		this.oscFilter.connect(this.gainNode);
		this.gainNode.connect(dest);
		if(!this.started) {
			this.oscFilter.start();
			this.started = true;
		}
	}

	getGeneratedDuration() {
		return this.duration;
	}

	createFilters(ctx) {
		this.oscFilter = ctx.createOscillator();
		this.gainNode = ctx.createGain();
		this.filters = [this.oscFilter, this.gainNode];
	}

	selectWaveform(ft) {
		this.oscFilter.type = ft;
	}

	openGui(whereToPut) {
		super.openGui(whereToPut);
		let that = this;
		let filterDrop = new Dropdown('#oscdropdn',undefined,function (e) {
			let targID = e.target.getAttribute('id');
			let targText = e.target.innerText;
			let fname = targID.substring(3);
			that.selectWaveform(fname);
			let namef = $('#oscdropdn');
			$(namef[0].firstChild).text(targText);
		});

		$(".dial").knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('id').substring(3);
			if (ctlId === 'frequency') {
				that.oscFilter.frequency.value = v;
			} else if (ctlId === 'gain') {
				that.gainNode.gain.value = v;
			} else if (ctlId === 'duration') {
				that.duration = v;
				console.log(this.duration);
			}
		}});
		this.selectWaveform('sine');
	}
};

