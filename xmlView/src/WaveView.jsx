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
  }

  componentWillUnmount() {
    // this.$el.somePlugin('destroy');
  }

  command(name, e) {
  	if(name = 'play') {
  		let startT = Number(this.osc.zone.startMilliseconds) / 1000;
  		let endT =  Number(this.osc.zone.endMilliseconds) / 1000;
		if(this.wave) {
			this.wave.surfer.play(startT, endT);
		} else {
			if(!this.state.data) {
				this.loadFile("/" + this.props.filename,(d)=>{
					this.playLocal(d, startT, endT);
				});
			} else {
				this.playLocal(this.state.data, startT, endT);
			}
		}
  	}
  }

  render() {
  	if (this.props.open) {
    	return <tr><td colSpan={this.props.editing ? 10 : 8}><div  ref={el => this.el = el}> </div></td></tr>;
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
	this.tinyPlayer = undefined;
	let newState = Object.assign({}, this.state);
	newState.data = data;
	this.setState(newState);
	this.loadInProgress = false;
  }

// use ajax to load wav data
  loadFile(filename, done)
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

  setupTinyPlayer() {
    if(this.tinyPlayer) return;
    this.tinyPlayer = new TinyPlayer();
  }

  playLocal(buf, startT, endT) {
	this.setupTinyPlayer();
	this.tinyPlayer.setBlob(buf,()=>{
		this.tinyPlayer.play(startT, endT);
	});
  }

}; // End of class

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class TinyPlayer {
	setBlob(blob, ready) {
		let me = this;
		if(this.blob === blob) {
			ready(this);
		}
		this.blob = blob;
		
		let fileReader = new FileReader();
		let arrayBuffer;

		fileReader.onloadend = () => {
			arrayBuffer = fileReader.result;
			audioCtx.decodeAudioData(arrayBuffer, function(buffer) {
				me.buffer = buffer;
				ready(me);
			});
		};
		fileReader.readAsArrayBuffer(blob);
	}

  play(startT, endT) {
	this.source = audioCtx.createBufferSource(); // creates a sound source
	this.source.buffer = this.buffer;
	this.source.connect(audioCtx.destination);
	this.source.start(0, startT, endT - startT);
  }
};


export {WaveView};