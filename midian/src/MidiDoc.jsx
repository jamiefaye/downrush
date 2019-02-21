import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
import Midi from "./Midi/Midi.js";
import {WedgeIndicator, PushButton, CopyToClipButton} from './GUIstuff.jsx';
import {MidiConversion} from "./MidiConversion.js";
import {pasteTrackJson, getFocusDoc} from "../../xmlView/lib/SongLib.js";


class MidiHeader extends React.Component {

  render() {
	let header = this.props.header;
	return (<h3>{header.name}</h3>);
	}
}

class MidiPlot extends React.Component {

  componentDidMount() {

	this.insetX = 6;
	this.insetY = 4;
	this.noteHeight = 4;
	this.scaling = 48;
	this.symbolize();
	this.dragging = false;
	this.dragStart = 0;
	this.start = 0;
	this.end = 0;
	this.duration = 0;
  }

  symbolize() {
  
  	console.log("Device Pixel Ratio: " + window.devicePixelRatio);
	let track = this.props.track;
	let firstTime = this.props.converter.lowTime;
	let notes = track.notes;
	let lowTime = 100000000;
	let highTime = -100000000;
	let lowNote = 1000;
	let highNote = -1000;
	let noteCount = notes.length;
	if (noteCount === 0) return;

	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		if (n.midi < lowNote) lowNote = n.midi;
		if (n.midi > highNote) highNote = n.midi;
		let t = n.time;
		let tend = t + n.duration;
		if (t < lowTime) lowTime = t;
		if (tend > highTime) highTime = tend;
	}
	let gw = highTime - lowTime;
	let gh = highNote - lowNote;
	if (gw < 0 || gh < 0) return;

	let parentDiv = $("<div class='midigrid'/>");
	let itemClass = 'midiitem';

	console.log("Min time: " + lowTime + " " + firstTime);

	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let nTime = n.time - firstTime;
		let x = Math.round(nTime * this.scaling + this.insetX);
		let w = Math.round(n.duration * this.scaling);
		if (w < 1) w = 1;
		if (w > 2) w--;
		let ypos = (highNote - n.midi) * this.noteHeight + this.insetY;
		let ndiv = $("<div class='" + itemClass + "'/>");
		// ndiv.text(trkLab);
		ndiv.css({left: x + 'px', top: ypos + 'px', width: w + 'px'});
		parentDiv.append(ndiv);
	}

	this.duration = highTime - firstTime;
	let highW = Math.round((highTime - firstTime) * this.scaling + this.insetX*2);
	let highH = Math.round((gh + 1) * this.noteHeight + this.insetY * 2 + 2);
	this.height = highH;
	this.width = highW;

	this.selection = $("<div class='selbox'/>");

	parentDiv.append(this.selection);
	parentDiv.css({width: highW + 'px', height: highH + 'px'});
	$(this.el).append(parentDiv);
  }

  changeSel(t0, t1) {
	let startX = this.timeToX(t0);
	let endX = this.timeToX(t1);
	this.start = t0;
	this.end = t1;

	// console.log("start: " + start + " end: " + end);
	this.selection.css({left: startX + 'px', width: (endX - startX) + 'px', top: 0 + 'px', height: this.height + 'px' });
  }

  timeToX(t) {

	let x = Math.round(t * this.scaling) + this.insetX;
	//if (x < 0) x = 0;
	//if (x > this.highW) x = this.highW;
	return x;
  }

  xToTime(xr) {

	let xt = (xr - this.insetX) / this.scaling;
	//if (xt < 0) xt = 0;
	//if (xt > this.duration) xt = this.duration;
	return xt;
  }

  render() {
	return <div ref={el => this.el = el}> </div>
  }

  bounds() {
  	return this.el.getBoundingClientRect();
  }

  getSelection() {
  	let firstTime = this.props.converter.lowTime;
  	return {
		start: this.start + firstTime,
		end:   this.end + firstTime
	}
  }
}


class MidiGrid extends React.Component {
  constructor(props) {
  	super(props);
  }

  render() {
  	return <div onMouseDown={(e)=>{this.begin_drag(e)}}>
		<MidiPlot ref={el => this.plot = el} track={this.props.track} converter={this.props.converter} />
  		</div>
  }

  begin_drag(e) {
	var dragActive;
	var t0;
	var t1;
	var me = this;
	var clientRect = me.plot.bounds();

	var rangeUpdater = function(e) {
		let x = e.clientX - clientRect.left;
		t1 = me.plot.xToTime(x);
		let tS = t0;
		let tE = t1;
		if (t1 < t0) {
			tS = t1;
			tE = t0;
		}
		me.plot.changeSel(tS, tE);
	}

	var eventMove = function (e) {
		if (!dragActive) return;
		rangeUpdater(e);
	}

	var eventUp = function (e) {
		dragActive = false;
		if (t0 === t1) {
			me.plot.changeSel(0,0)
		}
		let win = $(window);
		win.off('mousemove', eventMove);
		win.off('touchmove', eventMove);
		win.off('mouseup', eventUp);
		win.off('touchend', eventUp);
	}

	var eventDown = function (e) {
		let x = e.clientX - clientRect.left;
		t0 = me.plot.xToTime(x);
		t1 = t0;

		dragActive = true;

		let win = $(window);
		win.on('mousemove', eventMove); // dynamic listeners
		win.on('touchmove', eventMove);
		win.on('mouseup', eventUp);
		win.on('touchend', eventUp);
	}

	eventDown(e);
  }

  getSelectedTimes() {
	return this.plot.getSelection();
  }
}

class MidiTrack extends React.Component {

  render() {
		let track = this.props.track;
		let trackNum = this.props.trackNum;
		let song = this.props.song;
		let tname = track.name;
		let inst = track.instrument;
		
		return (<React.Fragment><table className='miditrack'><tbody><tr><td className='midiheadr'><table className='midihead'><tbody>
		<tr>
		<td className='midichan'><b>{trackNum}</b>:{track.channel}</td>
		<td className='midiinst'>{tname ? track.name : null}</td>
		</tr>
		<tr><td colSpan='2' className='midiinst'>{inst ? <i>{inst.name}</i> : null}</td></tr>
		<tr className='butnstr'><td colSpan='2' className='butnstd'>
		<PushButton title='+ Song' onPush={this.addSel.bind(this)} />
		<CopyToClipButton title='&rarr; Clip' getText={this.copySel.bind(this)} />
		</td></tr>
		</tbody></table></td>
		<td><MidiGrid ref={el => this.grid = el} track={track} converter={this.props.converter} /></td></tr></tbody></table>
		<p className='tinygap'></p>
		</React.Fragment>);
	}

  copySel() {
	let toCopy = this.props.track;
	let converter = this.props.converter;
	let trackNum = this.props.trackNum;
	let {start, end} = this.grid.getSelectedTimes();
	let converted = converter.convertTrackToDeluge(trackNum, start, end, converter.lowTicks, false);
	let asText = JSON.stringify(converted, null, 1);
	return asText;
  }

 addSel() {
	let toCopy = this.props.track;
	let converter = this.props.converter;
	let trackNum = this.props.trackNum;
	let {start, end} = this.grid.getSelectedTimes();
	let converted = converter.convertTrackToDeluge(trackNum, start, end, converter.lowTicks, false);

	pasteTrackJson(converted, getFocusDoc());
  }
};

 class MidiDocView extends React.Component {

// 		<pre>{this.props.midiText}</pre>
  render() {
	let midi = this.props.midi;
	if (!midi) return null;
	
	this.midiConversion = new MidiConversion(midi);
	let mc = this.midiConversion;
	mc.calcTimeBounds();

	return (<React.Fragment><MidiHeader header={midi.header} text={this.props.midiText}/>
		{midi.tracks.map((track, ix) =>{
			return <MidiTrack trackNum={ix + 1} track={track} key={ix} song={midi} converter={mc}/>
		})}
		<hr/>
		</React.Fragment>);
	}
}

 class MidiDoc {
   constructor(context) {
		this.context = context;
		this.jqElem = context.jqElem;
  }

	openOnBuffer(data) {
		var midiABuffer;
		let me = this;
		var fileReader = new FileReader();
		fileReader.onload = function(event) {
			midiABuffer = event.target.result;
			me.midi = new Midi(midiABuffer);
			me.midiText = JSON.stringify(me.midi, undefined, 2);
			me.context.midiText = me.midiText;
			me.context.midi = me.midi;
			me.render();
		};
		fileReader.readAsArrayBuffer(data);
	}

	render() {
		this.midiDoc = React.createElement(MidiDocView, this.context);
		ReactDOM.render(this.midiDoc, this.jqElem);
	}

} // End class

function openMidiDoc(where, params) {
	let context = {};
	context.jqElem =  where;
	let midiDoc = new MidiDoc(context);
	midiDoc.render();
	return midiDoc;
}

export {openMidiDoc};
