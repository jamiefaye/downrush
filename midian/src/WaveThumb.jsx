import $ from 'jquery';
import React from 'react';
import {Wave} from "../../xmlView/src/Wave.js";
import {WedgeIndicator, IconPushButton, PushButton} from './GUIstuff.jsx';

/*
class ZoomControls extends React.Component {

	render() {
	
		return (<table><tbody><tr><td className='boffo'>
			<IconPushButton className='butn' title='Zoom In'
			onPush={(e)=>{this.props.command('zoomIn', e)}}
			src='img/glyphicons-237-zoom-in.png'/>
		</td></tr><tr><td className='boffo'>
			<IconPushButton className='butn' title='Zoom Out'
			onPush={(e)=>{this.props.command('zoomOut', e)}}
			src='img/glyphicons-238-zoom-out.png'/>
		</td></tr>
		<tr><td className='boffo'>
		<IconPushButton className='butn' title='Waverly'
			onPush={(e)=>{this.props.command('openwave', e)}}
			src='img/glyphicons-594-voice.png'/>
		</td></tr>
		<tr><td height='32px'className='boffo'>
			<WedgeIndicator opened={this.props.showTab} toggler={e=>{this.props.command('toggletab', e)}} />
		</td></tr>	
		</tbody></table>);
	}
};
*/

class WaveThumb extends React.Component {
  constructor() {
	super();
	this.state = {};
	this.command = this.command.bind(this);
	this.noteDone = this.noteDone.bind(this);
  }

  componentDidMount() {
	this.filename = this.props.filename;
	this.hasNewData = false;
	if(this.props.open) {
		this.loadFile(this.props.filename);
	}
  }

  componentWillUnmount() {
    // this.$el.somePlugin('destroy');
  }


  zoom(amt) {
	
	let minPxWas = this.wave.surfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 192000;
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	this.wave.surfer.zoom(newPx);
}

  noteDone() {
  	if (this.panel){
	//	this.panel.setPlayState(false);
	}
  }

  command(name, e, panel) {
	if(name === 'play') {

//		let startT = Number(this.osc.zone.startMilliseconds) / 1000;
//		let endT =  Number(this.osc.zone.endMilliseconds) / 1000;
		let startT =0;
		let endT =  99999;
		// console.log("Play: " + startT + " End: " + endT);
//		this.panel = panel;
//		panel.setPlayState(true);
		if(this.wave) {
			if (this.wave.surfer.isPlaying()) {
				this.wave.surfer.pause();
			} else {
				this.wave.surfer.play(0, endT);
			}
		} else {
			if(!this.state.data) {
				this.loadFile(this.props.filename,(d)=>{
					this.playLocal(d, startT, endT);
				});
			} else {
				this.playLocal(this.state.data, startT, endT);
			}
		}
	} else if (name === 'zoomIn') {
		this.zoom(2.0);
	} else if (name === 'zoomOut') {
		this.zoom(0.5);
	} else if (name === 'toggletab') {
		this.props.toggleTab();
	} else if (name === 'openwave') {
		// Link to the Waverly editor
//		console.log("openWaverly " + this.props.filename);
		window.open("/DR/waverly/viewWAV.htm?" + this.props.filename);
	}
  }

  render() {
	if (this.props.open) {
		return <div className='wavethumb' ref={el => this.el = el}> </div>;
	} else return null;
  }
 
 /*
  shouldComponentUpdate(nextProps, prevState) {
	let fileChanged = this.filename !== nextProps.filename;
	let openChanged = this.props.open != nextProps.open;
	return true;

	// return fileChanged || openChanged;
  }
*/
  componentDidUpdate() {
	// console.log("componentDidUpdate start");

	let nameChanged = this.props.filename != this.filename;
	let need4open = this.props.open && !this.state.data && !this.loadInProgress;

	if( nameChanged || need4open) {
		// console.log("starting load of " + this.props.filename);
		this.loadFile(this.props.filename);
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

/*
	this.wave.surfer.on('start-end-change', (w, e)=>{
		let {start, end} = this.wave.getSelection();
		if (this.props.selectionUpdate) {
			this.props.selectionUpdate(start, end);
		}
	});
*/
	this.wave.surfer.on('finish', (e)=>{
		this.noteDone(e);
	});

	this.wave.surfer.on('pause', (e)=>{
		this.noteDone(e);
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
	this.setState({data: data});
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
    this.tinyPlayer = new TinyPlayer(this.noteDone);
  }

  playLocal(buf, startT, endT) {
	this.setupTinyPlayer();
	if (this.tinyPlayer.isPlaying()) {
		this.tinyPlayer.stop();
		this.noteDone();
		return;
	}
	this.tinyPlayer.setBlob(buf,()=>{
		this.tinyPlayer.play(startT, endT);
	});
  }

}; // End of class

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class TinyPlayer {
	constructor(noteDone) {
		this.noteDone = noteDone;
		this.ended = this.ended.bind(this);
		this.playing = false;
	}

	ended() {
		this.playing = false;
		this.noteDone();
	}

	isPlaying() {
		return this.playing;
	}

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

  stop() {
	if(this.playing) {
		this.source.stop();
	}
  }
  play(startT, endT) {
	this.source = audioCtx.createBufferSource(); // creates a sound source
	this.source.buffer = this.buffer;
	this.source.connect(audioCtx.destination);
	this.source.onended = this.ended;
	this.playing = true;
	this.source.start(0, startT, endT - startT);
  }
};


export {WaveThumb};