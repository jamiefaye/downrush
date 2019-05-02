import $ from'jquery';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import osc_template from'./templates/osc_template.handlebars';
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
		let me = this;
		let filterDrop = new Dropdown($('.oscdropdn', this.rootElem),undefined,function (e) {
			let targID = e.target.getAttribute('data-id');
			let targText = e.target.innerText;
			let fname = targID;
			me.selectWaveform(fname);
			let namef = $('.oscdropdn', me.rootElem);
			$(namef[0].firstChild).text(targText);
		});

		$(".dial", this.rootElem).knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('data-id');
			if (ctlId === 'frequency') {
				me.oscFilter.frequency.value = v;
			} else if (ctlId === 'gain') {
				me.gainNode.gain.value = v;
			} else if (ctlId === 'duration') {
				me.duration = v;
			}
		}});
		this.selectWaveform('sine');
	}
};

