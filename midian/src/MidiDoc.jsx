import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
import Midi from "./Midi/Midi.js";
import {WedgeIndicator, PushButton, CopyToClipButton} from './GUIstuff.jsx';
import {MidiConversion} from "./MidiConversion.js";

var noteHeight = 4;
var scaling = 32;
const xPlotOffset = 0;

class MidiHeader extends React.Component {

  render() {
	let header = this.props.header;
	return (<h3>{header.name}</h3>);
	}
}

class MidiGrid extends React.Component {

  componentDidMount() {
	this.symbolize();
  }

  symbolize() {
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
		let x = Math.round(nTime * scaling + xPlotOffset);
		let w = Math.round(n.duration * scaling);
		if (w < 1) w = 1;
		if (w > 2) w--;
		let ypos = (highNote - n.midi) * noteHeight + 2;
		let ndiv = $("<div class='" + itemClass + "'/>");
		// ndiv.text(trkLab);
		ndiv.css({left: x + 'px', top: ypos + 'px', width: w + 'px'});
		parentDiv.append(ndiv);
	}

	let highW = Math.round((highTime - firstTime) * scaling + xPlotOffset);
	let highH = Math.round((gh + 1) * noteHeight + 4);
	parentDiv.css({width: highW + 'px', height: highH});
	$(this.el).append(parentDiv);
  }

  render() {
  	return <div ref={el => this.el = el}> </div>
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
		<CopyToClipButton title='Copy->Clip' getText={this.copySel.bind(this)} /></td></tr>
		</tbody></table></td>
		<td>
		<MidiGrid track={track} converter={this.props.converter}/></td></tr></tbody></table>
		<p className='tinygap'></p>
		</React.Fragment>);
	}

  copySel() {
	let toCopy = this.props.track;
	let converter = this.props.converter;
	let trackNum = this.props.trackNum;

	let converted = converter.convertTrackToDeluge(trackNum, converter.lowTime, converter.highTime, converter.lowTicks);
	let asText = JSON.stringify(converted, null, 1);
	return asText;
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

export {openMidiDoc, MidiDoc};
