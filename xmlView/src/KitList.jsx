import $ from 'jquery';
import createClass from "create-react-class";
import React from 'react';
import ReactDOM from "react-dom";
import {WaveView} from './WaveView.jsx';
import {forceArray} from "./JsonXMLUtils.js";
import {formatSound, sample_path_prefix} from "./viewXML.js";

function fmtTime(tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
}

var loopModeTab = ["Cut", "Once", "Loop", "Stretch"];

function WedgeIndicator(props) {
	return (<span className='wedge' onClick={props.toggler}>
	{props.openned ? '▼' : '►'}
	</span>);
}

class SampleEntry extends React.Component {
  constructor() {
	super();
	this.state = {
		openned: false,
  	};
  }

  render() {
  	let da = [
		<tr className="kitentry" key='sinfo'>
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator openned={this.state.openned} toggler={e=>{this.setState((prevState, props) =>{
		  	return  {openned: !prevState.openned}})}}/></td>
		  <td>{this.props.name}</td>
		  <td style={{textAlign: 'left'}}>{this.props.osc1.fileName}</td>
		  <td className="startms">{fmtTime(this.props.osc1.zone.startMilliseconds)}</td>
		  <td className="endms">{fmtTime(this.props.osc1.zone.endMilliseconds)}</td>
		  <td className="loopMode">{loopModeTab[this.props.osc1.loopMode]}</td>
		  <td><audio controls className="smallplayer" preload="none" style={{backgroundColor: 'blue'}}><source src={'/' + this.props.osc1.fileName} type="audio/wav" /></audio></td>
		</tr>];
	if (this.state.openned) {
		da.push(<WaveView key='wview' kitProps={this.props} index = {this.props.index} selectionUpdate={this.props.selectionUpdate} />);
	}
	return da;
  }
  

};


var KitList = createClass({
  render: function() {

	return (
	<table className='kit_tab'><tbody>
 	<tr className='kithead'>
	<th className='kit_opener xmltab' kititem='-1'>►</th>
	<th>Name</th>
	<th>Path</th>
	<th>Start</th>
	<th>End</th>
	<th>End</th>
	<th>Player</th>
	</tr>
	{this.props.kitList.map((line, ix) =>{
		return <SampleEntry index={ix} key={ix} selectionUpdate = {this.props.selectionUpdate} {...line} />
	})}
	</tbody>
	</table>
	);
  }
});

class KitView {
	constructor(context) {
		this.context = context;
		this.context.selectionUpdate = this.selectionUpdate.bind(this);
		this.kitObj = context.kitObj;
		this.jqElem = context.jqElem;
	}

	render() {
		this.kitElem = React.createElement(KitList, this.context);
		ReactDOM.render(this.kitElem, this.jqElem);
	}
	
	selectionUpdate(b, e, ix) {
	//	console.log(ix + " B: " + b + " E: " + e);
		let kits = this.context.kitList;
		let newZone = {startMilliseconds: Math.round(b * 1000) , endMilliseconds: Math.round(e * 1000)};
		kits[ix].osc1.zone = newZone;
		this.render();
	}
};


function formatKit(json, kitParams, where) {
	let kitList = forceArray(json.soundSources.sound);
	let context = {};
	context.kitList = kitList;
	context.sample_path_prefix = sample_path_prefix;
	context.jqElem =  where;
	let kitView = new KitView(context);
	kitView.render();
}


export {KitList, formatKit};
