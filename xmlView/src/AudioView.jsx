import $ from 'jquery';
import React from 'react';
import {Wave} from './Wave.js';


class AudioView extends React.Component {
  constructor(props) {
	super(props);
	this.filename = "";
	this.state = {};
  }

  componentDidMount() {
	this.wave = new Wave(this.el, this.props.waveprops);
	if(this.props.reportWave) this.props.reportWave(this.wave);
	if (this.props.filename !== undefined) {
		this.loadFile(this.props.filename); 
	}

  }

  componentDidUpdate() {
	console.log("componentDidUpdate");
	let nameChanged = this.props.filename !== this.filename;

	if (nameChanged) {
		// console.log("starting load of " + this.props.filename);
		this.loadFile('/' + this.props.filename); 
	} else if (this.state.data && (this.hasNewData || !this.wave)) {
		this.openWaveSurfer(this.state.data);
	}
	// console.log("componentDidUpdate end");
  }

  setEditData(data) {
	this.hasNewData = true;
	this.setState({data: data});
	this.loadInProgress = false;
  }

/*
  loadFile(filename, done)
{
	this.loadInProgress = true;
	this.filename = this.props.filename;
	let fs = getRootFS();
	let me = this;

	fs.read(filename, 'blob', function (data, status) {
		me.setEditData(data);
		if(done) done(data);
	});
  }
*/

   openWaveSurfer(data) {
	this.wave.openOnBuffer(data);
  }
  
// use ajax to load wav data
  loadFile(filename, done)
{	// console.log("loadFile");
	if (this.loadInProgress) return;

	this.loadInProgress = true;
	this.filename = this.props.filename;

	let me = this;
	$.ajax({
	url         : '/' + this.filename,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		me.setEditData(data);
		if(done) done(data);
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

  render() {
  // ** hack to align note labels.
	return <table><tbody><tr><td><div style= {{width: '26px'}}></div></td><td><div style={{width: '192px'}} ref={el => this.el = el}> </div></td></tr></tbody></table>;
  }
}

export {AudioView};
