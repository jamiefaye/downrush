import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
import Midi from "./Midi/Midi.js";

 class MidiDoc extends React.Component {
 
	componentDidMount() {
		this.rootDivId = this.props.rootDivId;
	}

	openOnBuffer(data) {
		var midiABuffer;
		let me = this;
		var fileReader = new FileReader();
		fileReader.onload = function(event) {
			midiABuffer = event.target.result;
			me.midi = new Midi(midiABuffer);
			me.miditext = JSON.stringify(me.midi, undefined, 2);
			me.renderMidi();
			// console.log(this.miditext);
		};
		fileReader.readAsArrayBuffer(data);
	}
	
	render() {
		return (<pre>{this.miditext}</pre>);
	}

} // End class

function openMidiDoc(where, params) {
	let context = {};
	context.jqElem =  where;
	let midiDoc = React.createElement(MidiDoc, context);
	let rep = $("<div> </div>");
	where.append(rep);
	ReactDOM.render(midiDoc, rep[0]);
}

export {openMidiDoc, MidiDoc};
