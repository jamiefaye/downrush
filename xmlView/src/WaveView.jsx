import $ from 'jquery';
import React from 'react';
import Wave from './Wave.js';

class WaveView extends React.Component {

  componentDidMount() {
  	this.$el = $(this.el);
	this.osc = this.props.osc;
	
	this.filename = this.props.fname;
	this.loadFile("/" + this.filename,(d)=>{this.setEditData(d, false)});
  }

  componentWillUnmount() {
    // this.$el.somePlugin('destroy');
  }

  render() {
    return <tr><td colSpan='8'><div ref={el => this.el = el}> </div></td></tr>;
  }

  shouldComponentUpdate(nextProps, prevState) {
	let should = this.filename !== nextProps.fname;
	if(should) this.changeToFile();
	return should;
  }

  changeToFile(filen) {
	this.osc = this.props.osc;
	this.filename = this.osc.fileName;
	this.loadFile("/" + this.filename, (d)=>{
		this.setEditData(d, true);
		this.forceUpdate();
	});
  }

  setEditData(data, reselect)
{
	if(!this.wave) {
		this.wave = new Wave(this.el);
	}
	this.wave.openOnBuffer(data);

	this.wave.surfer.on('start-end-change', (w, e)=>{
		let {start, end} = this.wave.getSelection();
		this.props.selectionUpdate(start, end);
	});

	if (reselect) {
		this.wave.initialZone = {startMilliseconds: 0, endMilliseconds: -1};
	} else if (this.osc) {
		this.wave.initialZone = this.osc.zone;
		this.wave.initialZone.endMilliseconds = Number(this.wave.initialZone.endMilliseconds);
	}
}

// use ajax to load wav data
  loadFile(fname, done)
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
		done(data);
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