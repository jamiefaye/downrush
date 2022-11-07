import $ from 'jquery';
import React from 'react';
import Wave from './Wave.js';
import {WedgeIndicator, IconPushButton, PushButton} from './GUIstuff.jsx';
import {TinyPlayer} from "./TinyPlayer.js";


// WaveView is a superclass for both SampleView (used in the kit editor) and
// AudioView (used in the track editor).
class WaveView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.filename = this.props.filename;
		this.hasNewData = false;

		this.noteDone = this.noteDone.bind(this);
	}

  componentDidMount() {
	if(this.props.open) {
		this.loadFile("/" + this.props.filename);
	}
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
		this.wave = new Wave(this.el, this.waveParams);
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

	this.wave.surfer.on('finish', (e)=>{
		this.noteDone(e);
	});

	this.wave.surfer.on('pause', (e)=>{
		this.noteDone(e);
	});

	if (this.osc) {
		this.wave.initialZone = {};
		let startMS;
		let endMS;
		if (this.osc.zone.startMilliseconds)
		{
			startMS = Number(this.wave.initialZone.startMilliseconds);
			endMS = Number(this.osc.zone.endMilliseconds);
		}
		 else {
			 startMS = Number(this.osc.zone.startSamplePos) / 44.1;
			 endMS = Number(this.osc.zone.endSamplePos) / 44.1;
		}
		this.wave.initialZone.startMilliseconds = startMS;
		this.wave.initialZone.endMilliseconds = endMS;
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


  command(name, e, panel) {
	if(name === 'play') {
		let startT = 0;
		let endT =  999999;
		let track = this.props.track;

		if (this.osc && this.osc.zone) {
			if (this.osc.zone.hasOwnProperty("startMilliseconds")) {
				startT = Number(this.osc.zone.startMilliseconds) / 1000;
				endT = Number(this.osc.zone.endMilliseconds) / 1000;
			} else {
				startT = Number(this.osc.zone.startSamplePos) / 44100;
				endT = Number(this.osc.zone.endSamplePos) / 44100;
			}
		} else {
			if (track) {
				startT = Number(track.startSamplePos) / 44100;
				endT = Number(track.endSamplePos) / 44100;
			}
		}

		// console.log("Play: " + startT + " End: " + endT);
		this.panel = panel;
		if (this.panel) {
			this.panel.setPlayState(true);
		}

		if(this.wave) {
			if (this.wave.surfer.isPlaying()) {
				this.wave.surfer.pause();
			} else {
				this.wave.surfer.play(startT, endT);
			}
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

  noteDone() {
	if (this.panel) {
		this.panel.setPlayState(false);
	}
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
 
}


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


class SampleView extends WaveView {
  constructor(props) {
	super(props);

	this.command = this.command.bind(this);
	this.waveParams = {splitChannels: true};

  }

  componentDidMount() {
	super.componentDidMount();
	this.osc = this.props.osc;
  }

  zoom(amt) {
	
	let minPxWas = this.wave.surfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 192000;
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	this.wave.surfer.zoom(newPx);
}


  command(name, e, panel) {
	if (name === 'zoomIn') {
		this.zoom(2.0);
	} else if (name === 'zoomOut') {
		this.zoom(0.5);
	} else if (name === 'toggletab') {
		this.props.toggleTab();
	} else if (name === 'openwave') {
		// Link to the Waverly editor
//		console.log("openWaverly " + this.props.filename);
		window.open("/DR/waverly/viewWAV.htm?"+ '/' + this.props.filename);
	} else {
		super.command(name, e, panel);
	}
  }

  render() {
	if (this.props.open) {
		return <tr><td colSpan={this.props.editing ? 8 : 6}><div ref={el => this.el = el}> </div></td><td><ZoomControls command={this.command} showTab={this.props.showTab}/></td></tr>;
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



}; // End of class


class AudioView extends WaveView {
  constructor(props) {
	super(props);
  }

  render() {
  	let track = this.props.track;
  	let trackLen = track.length;
		return <div style={{width: trackLen + 'px'}}>
			{this.props.open ? <div ref={el => this.el = el}> </div> : null}
			</div>
  }
}




export {WaveView, SampleView, AudioView};