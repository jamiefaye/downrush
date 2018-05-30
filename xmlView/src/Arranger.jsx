import React from 'react';
import ReactDOM from "react-dom";
import $ from'jquery';
import {gamma_correct, trackKind} from './viewXML.js';
import {forceArray} from "./JsonXMLUtils.js";
import {patchNames, kitNames} from "./js/delugepatches.js";

var chanHeight = 16;
var scaling = 0.2;
var xPlotOffset = 150;

var groupColorTab = [0x005AA5, 0xB0004F, 0xb04F00, 0x00C738, 0xFA0005, 0x679800,
 0x0000FF, 0xEA1500, 0x3300CC, 0x25DA00, 0x00F609, 0x6D0092];


function patchLabel(track) {
	let kind = trackKind(track);
	let patchStr = "";
	let patch = Number(track.instrumentPresetSlot);

	if (kind === 'kit' || kind === 'sound') {
		patchStr = patch;
		let subpatch = Number(track.instrumentPresetSubSlot);
		if (subpatch >= 0) {
			patchStr += ' ';
			patchStr += String.fromCharCode(subpatch + 65); // 0 = a, 1 = b, …
		}
	}

	var patchName;
	if (kind === 'kit') {
		patchName = kitNames[patch];
	} else if (kind === 'midi') {
		patchStr = Number(track.midiChannel) + 1;
		patchName = '';
	} else if (kind === 'sound') {
		patchName = patchNames[patch];
	} else if (kind === 'cv') {
		patchStr = Number(track.cvChannel) + 1;
		patchName = '';
	}
	if (patchName) patchName += ' ';
		else patchName = '';
	patchName += patchStr;
	return patchName;
}


// 00000000	Start
// 000000C0	Length
// 00000002	Track

class Instrument extends React.Component {

  componentDidMount() {
	let inst = this.props.inst;
	let instString = inst.trackInstances;
	if (!instString) return;
	let ypos = 2;

	let parentDiv = $("<div class='arrgrid'/>");
	let song = this.props.song;
	let trackTab = forceArray(song.tracks.track);
	let arrangeOnlyTab = [];
	if (song.arrangementOnlyTracks) {
		arrangeOnlyTab = forceArray(song.arrangementOnlyTracks.track);
	}

	let maxTrack = trackTab.length;
		
	let firstTimeThru = false;

	let highTime =  0;

	for (var nx = 2; nx < instString.length; nx += 24) {
		let start = parseInt(instString.substring(nx, nx + 8), 16);
		let len = parseInt(instString.substring(nx + 8, nx + 16), 16);
		let trk = parseInt(instString.substring(nx + 16, nx + 24), 16);
		let endT = start + len;
		if (endT > highTime) highTime = endT;
		let trkColor = 0xFFFFFF;
		let itemClass = 'arritem';
		let trkLab = '';
		if (trk < maxTrack) {
			let track = trackTab[trk];
			if (track) {
				trkLab = maxTrack - trk;
				let sect = track.section;
				trkColor = groupColorTab[sect % groupColorTab.length];
				if (!firstTimeThru) {
					let labName = patchLabel(track);
					if (labName != undefined) {
						let labdiv = $("<div class='arrlab'/>");
						labdiv.text(labName);
						labdiv.css({left: 0, bottom: ypos + 'px'});
						parentDiv.append(labdiv);
					}
				}
				firstTimeThru = true;	
			}
		} else {
			itemClass = 'arritembow';
			trkLab = (arrangeOnlyTab.length - trk & 0x7FFFFFFF) + 'a';
			
		}

		let colorString = '#' + gamma_correct(trkColor.toString(16));
		let x = start * scaling + xPlotOffset;
		let w = len * scaling;
		if (w > 2) w--;

		//console.log(trk + " " + start + " " + len);
		let ndiv = $("<div class='" + itemClass + "'/>");
		ndiv.text(trkLab);
		ndiv.css({left: x + 'px', bottom: ypos + 'px', width: w + 'px', "background-color": colorString});
		parentDiv.append(ndiv);
		

	}
	let highW = highTime * scaling + xPlotOffset;
	parentDiv.css({width: highW + 'px'});
	$(this.el).append(parentDiv);
  }

  render() {
	return <div ref={el => this.el = el}> </div>;
  }

};


class Arranger extends React.Component {
  render() {
	if (!this.props.instruments) {
		return (<div ref={el => this.el = el}> </div>);
	}
	let nInstruments = this.props.instruments.length;
	return (<div ref={el => this.el = el}>
	{this.props.instruments.slice(0).reverse().map((inst, ix) =>{
		return <Instrument index={ix} maxIndex = {nInstruments} song={this.props.song} inst={inst} key={inst.uniqueId} keyValue={inst.uniqueId}/>
	})}
	 </div>);
  }
}

function showArranger(song, where) {
//	let arrangement = json.soundSources.sound; // forceArray(json.soundSources.sound);
	let context = {};
	context.jqElem =  where;
	context.song = song;
	context.instruments = song.instruments;
	let arranger = React.createElement(Arranger, context);
	let rep = $("<div> </div>");
	where.append(rep);
	ReactDOM.render(arranger, rep[0]);
}


export {showArranger, groupColorTab};