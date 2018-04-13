import $ from 'jquery';
import React from 'react';
import Wave from './Wave.js';

class WaveView extends React.Component {
  constructor() {
	super();
	this.state = {};
  }
  componentDidMount() {
	this.osc = this.props.osc;
	this.filename = this.props.filename;
	this.hasNewData = false;
	this.state = {};
	// this.loadFile("/" + this.filename,(d)=>{this.setEditData(d, false)});
  }

  componentWillUnmount() {
    // this.$el.somePlugin('destroy');
  }

/*
  captureSurferRef(el) {
	console.log("CaptureRef");
	this.el = el;
	//this.$el = $(this.el);
  }
*/
  command(name, e) {
  	if(name = 'play' && this.wave) {
  		let startT = Number(this.osc.zone.startMilliseconds) / 1000;
  		let endT =  Number(this.osc.zone.endMilliseconds) / 1000;
		this.wave.surfer.play(startT, endT);
  	}
  }

  render() {
  	if (this.props.open) {
    	return <tr><td colSpan='8'><div  ref={el => this.el = el}> </div></td></tr>;
    } else return null;
  }

  shouldComponentUpdate(nextProps, prevState) {
	let fileChanged = this.filename !== nextProps.filename;
	let openChanged = this.props.open != nextProps.open;
	return true;

	// return fileChanged || openChanged;
  }

  componentDidUpdate() {
	// console.log("componentDidUpdate start");

	let nameChanged = this.props.filename != this.filename;
	let need4open = this.props.open && !this.state.data && !this.loadInProgress;

	if( nameChanged || need4open) {
		// console.log("starting load of " + this.props.filename);
		this.loadFile("/" + this.props.filename);
	} else if (this.props.open && this.state.data && (this.hasNewData || !this.wave)) {
		// console.log("OpenWaveSurfer");
		this.openWaveSurfer(this.state.data);
	} else if (!this.props.open) {
		this.wave = null;
	}
	// console.log("componentDidUpdate end");
  }

  openWaveSurfer(data) {
  	// console.log("b4 openWaveSurfer " + this.props.filename);
	if(!this.wave) {
		this.wave = new Wave(this.el);
		// console.log("new Wave");
	}
	this.hasNewData = false;
	this.wave.openOnBuffer(data);

	this.wave.surfer.on('start-end-change', (w, e)=>{
		let {start, end} = this.wave.getSelection();
		if (this.props.selectionUpdate) {
			this.props.selectionUpdate(start, end);
		}
	});

	if (this.osc) {
		this.wave.initialZone = {};
		this.wave.initialZone.startMilliseconds = Number(this.osc.zone.startMilliseconds);
		this.wave.initialZone.endMilliseconds = Number(this.osc.zone.endMilliseconds);
	}
	// console.log("aft openWaveSurfer");
  }

  setEditData(data) {
	// console.log("setEditData");
	this.hasNewData = true;
	let newState = Object.assign({}, this.state);
	newState.data = data;
	this.setState(newState);
	this.loadInProgress = false;
  }

// use ajax to load wav data
  loadFile(filename)
{	// console.log("loadFile");
	this.loadInProgress = true;
	this.filename = this.props.filename;

	let me = this;
	$.ajax({
	url         : filename,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
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

export {WaveView};