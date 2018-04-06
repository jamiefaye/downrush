import $ from'./js/jquery-3.2.1.min.js';
import React from 'react';
import ReactDOM from "react-dom";
import Wave from './Wave.js';
import {forceArray} from "./JsonXMLUtils.js";
import {formatSound, sample_path_prefix} from "./viewXML.js";
import {KitList} from './KitList.jsx';

class WaveView extends React.Component {

  componentDidMount() {
  	this.$el = $(this.el);
	this.kitSound = this.props.kitProps;
	
	this.filename = this.kitSound.osc1.fileName;
	console.log("Load: " + this.filename);
	this.loadFile("/" + this.filename);
  }

  componentWillUnmount() {
    // this.$el.somePlugin('destroy');
  }

  render() {
    return <tr><td colSpan='8'><div ref={el => this.el = el}> </div></td></tr>;
  }

/*
  constructor(fname, kitSound, whenDone) {
	this.fname = fname;
	this.idNumber = gIdCounter++;

	this.homeId = this.idFor(name);
	this.kitSound = kitSound;
	this.whenDone = whenDone;
	this.waveElement = wavegroup_template({idsuffix: this.idNumber});
  }
*/

  setEditData(data)
{
	if(!this.wave) {
		this.wave = new Wave(this.el);
	}
	this.wave.openOnBuffer(data);
	if (this.kitSound) {
		this.wave.initialZone = this.kitSound.osc1.zone;
	}

	this.wave.surfer.on('start-end-change', (w, e)=>{
		let {start, end} = this.wave.getSelection();
		// console.log("S: " + start + " E: " + end);
		/*
		this.kitSound.osc1.zone.startMilliseconds = Math.round(start * 1000);
		this.kitSound.osc1.zone.endMilliseconds = Math.round(end * 1000);

		let soundE = $(w.rootDivId).closest('.soundentry')[0];
		let soundHdr = soundE.previousElementSibling;
		let textEl = $('.startms', soundHdr);
		$(textEl).text(fmtTime3(start));
		$('.endms', soundHdr).text(fmtTime3(end));
		*/
	});

}

// use ajax to load wav data
  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		//me.whenDone(data);
		me.setEditData(data);
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

}; // End of class

function formatKit(json, obj, kitParams, track) {
	let kitList = forceArray(json.soundSources.sound);
	let context = {};
	context.kitList = kitList;
	context.sample_path_prefix = sample_path_prefix;
	let anEl = $("#jtab" + 0)[0];
	ReactDOM.render(React.createElement(KitList, context), anEl);	
}

export {WaveView, formatKit};