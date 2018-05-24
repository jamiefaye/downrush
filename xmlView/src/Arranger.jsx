import React from 'react';
import ReactDOM from "react-dom";
import $ from'jquery';

var chanHeight = 16;
var scaling = 0.25;
var xPlotOffset = 32;

// 00000000	Start
// 000000C0	Length
// 00000002	Track

class Instrument extends React.Component {

  componentDidMount() {
	let inst = this.props.inst;
	let instString = inst.trackInstances;
	let ypos = 8;

	let parentDiv = $("<div class='arrgrid'/>");
	let labName = 'Name'; // rowInfo.name;

	if (labName != undefined) {
		let labdiv = $("<div class='arrlab'/>");
		labdiv.text(labName);
		labdiv.css({left: 0, bottom: (ypos - 2) + 'px'});
		parentDiv.append(labdiv);
	}

	for (var nx = 2; nx < instString.length; nx += 24) {
		let start = parseInt(instString.substring(nx, nx + 8), 16);
		let len = parseInt(instString.substring(nx + 8, nx + 16), 16);
		let trk = parseInt(instString.substring(nx + 16, nx + 24), 16);

		let x = start * scaling + xPlotOffset;
		let w = len * scaling;
		if (w > 2) w--;

		//console.log(trk + " " + start + " " + len);
		let ndiv = $("<div class='arritem'/>");
		ndiv.css({left: x + 'px', bottom: ypos + 'px', width: w + 'px', "background-color": 'gray'});
		parentDiv.append(ndiv);
	}
	$(this.el).append(parentDiv);
  }

  render() {
	return <div ref={el => this.el = el}> </div>;
  }

};


class Arranger extends React.Component {
  render() {
	return (<div ref={el => this.el = el}>
	{this.props.instruments.map((inst, ix) =>{
		return <Instrument index={ix} inst={inst} key={inst.uniqueId} keyValue={inst.uniqueId}/>
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


export {showArranger};