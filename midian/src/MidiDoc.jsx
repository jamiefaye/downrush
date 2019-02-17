import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
import Midi from "./Midi/Midi.js";

var noteHeight = 4;
var scaling = 60;
var xPlotOffset = 0;

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
  	this.symbols = [];
	let track = this.props.track;
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

	for (let i = 0; i < noteCount; ++i) {
		let n = notes[i];
		let x = Math.round(n.time * scaling + xPlotOffset);
		let w = Math.round(n.duration * scaling);
		if (w < 1) w = 1;
		if (w > 2) w--;
		let ypos = (highNote - n.midi) * noteHeight;
		let ndiv = $("<div class='" + itemClass + "'/>");
		// ndiv.text(trkLab);
		ndiv.css({left: x + 'px', top: ypos + 'px', width: w + 'px'});
		parentDiv.append(ndiv);
	}

	let highW = Math.round(highTime * scaling + xPlotOffset);
	let highH = Math.round((gh + 1) * noteHeight + 16);
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
	    let inst = track.instrument;
		return (<React.Fragment><table>
		<tr><th>Track</th><th>Channel</th><th>Instrument</th></tr>
		<tr>
		<td>{trackNum}</td>
		<td>{track.channel}</td>
		<td>{inst ? inst.name : null}</td>
		</tr>
		</table>
		<p class='tinygap'></p>
		<MidiGrid track={track} />
		</React.Fragment>);
	}
};

 class MidiDocView extends React.Component {
  render() {
	let midi = this.props.midi;
	if (!midi) return null;

	return (<React.Fragment><MidiHeader header={midi.header} text={this.props.midiText}/>
		{midi.tracks.map((track, ix) =>{
			return <MidiTrack trackNum={ix + 1} track={track} key={ix}/>
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
