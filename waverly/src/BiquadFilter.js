import $ from'./js/jquery-3.2.1.min.js';
import knob from'./js/jquery.knob.js';
import {FilterBase} from './Filters.js';
import {quadfilter_template} from'./templates.js';
import Dropdown from './Dropdown.js';

export default class BiQuadFilter extends FilterBase {
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

	createFilters(ctx) {
		this.biquadFilter = ctx.createBiquadFilter();
		this.filters = [this.biquadFilter];
	}


	selectSubfilter(ft) {
		this.biquadFilter.type = ft;

		if (ft === 'lowshelf' || ft === 'highshelf' || ft === 'peaking') $('.gain_div').show(); else $('.gain_div').hide();
		if (ft !== 'lowshelf' && ft !== 'highshelf') $('.q_div').show(); else $('.q_div').hide();
	}

	openGui(whereToPut) {
		super.openGui(whereToPut);
		let that = this;
	
		let filterDrop = new Dropdown($('.quaddropdn', this.rootElem),undefined,function (e) {
			let targID = e.target.getAttribute('data-id');
			let targText = e.target.innerText;
			let fname = targID;
			that.selectSubfilter(fname);
			let namef = $('.quaddropdn', that.rootElem);
			$(namef[0].firstChild).text(targText);
		});

		$(".dial").knob({change: function (v) {
			let inp = this.i[0];
			let ctlId = inp.getAttribute('data-id');
			that.biquadFilter[ctlId].value = v;
		}});
		this.selectSubfilter('lowpass');
	}
};

