import $ from 'jquery';
import React from 'react';
import Wave from './Wave.js';

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
		this.props.selectionUpdate(start, end);
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

export {WaveView};