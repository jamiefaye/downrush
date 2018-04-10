import createClass from "create-react-class";
import React from 'react';
import ReactDOM from "react-dom";
import Dropdown from 'react-dropdown';
import {WaveView} from './WaveView.jsx';
import {openFileBrowser} from './FileBrowser.js';
import {forceArray} from "./JsonXMLUtils.js";
import {formatSound, sample_path_prefix} from "./viewXML.js";
import {observer} from 'mobx-react';
import {observable} from 'mobx';

function fmtTime(tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
}

var loopModeTab = ["Cut", "Once", "Loop", "Stretch"];

var KIT_SOUND_NAMES = ["KICK",
"SNARE",
"HATC",
"HATO",
"SHAK",
"TAMB",
"CLAV",
"CLAP",
"CRAS",
"COWB",
"MARACA",
"RIDE",
"RIM",
"TOMB",
"TOMH",
"TOML",
"TOMM",
"TOMT",
"TRIA",
"SNAP",
"BLOC",
"BONH",
"BONL",
"CABA",
"CHIM",
"CHIN",
"CLIC",
"CONH",
"CONL",
"CONM",
"CONT",
"DRON",
"GUIR",
"HCLO",
"HOME",
"META",
"PERC",
"QUIJ",
"RANK",
"SOLA",
"TIMH",
"TIML",
"TRAS",
"TRUC"];

function WedgeIndicator(props) {
	return (<span className='wedge' onClick={props.toggler}>
	{props.openned ? '▼' : '►'}
	</span>);
}

@observer class SampleEntry extends React.Component {
  constructor() {
	super();
	this.state = {
		openned: false,
  	};
  }

  selectionUpdate(b, e) {
  	let newZone = {startMilliseconds: Math.round(b * 1000) , endMilliseconds: Math.round(e * 1000)};
  	this.props.osc.zone = newZone;
  }

  onLoopSelect(item) {
  	let ix = loopModeTab.findIndex((v)=>{
  	let r = v === item.value;
  	return r});
  	if (ix >= 0) {
		this.props.osc.loopMode = ix;
  	}
  }

  onNameSelect(item) {
  	console.log(item.value);
	this.props.kito.name = item.value;
  }

  onChangeFilePath(e) {
  	let initial = this.props.osc.fileName;
	if (!initial) initial = '/';
	let me = this; 
	openFileBrowser({
		initialPath:  initial,
		opener: function(name) {
			me.props.osc.fileName = name;
		}
	});
  }

  render() {
   const defaultOption = loopModeTab[this.props.osc.loopMode];
   return (<React.Fragment>
		<tr className="kitentry" key='sinfo'>
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator openned={this.state.openned} toggler={e=>{this.setState((prevState, props) =>{
		  	return  {openned: !prevState.openned}})}}/></td>
		  {this.state.openned ? (<td><Dropdown options={KIT_SOUND_NAMES} onChange={(item)=>{this.onNameSelect(item)}} value={this.props.name} /></td>)
		  					  :  <td>{this.props.name}</td>}
		  {this.state.openned ? (<td onClick={this.onChangeFilePath.bind(this)} style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)
		  					  : (<td style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)}
	  	  <td className="startms">{fmtTime(this.props.osc.zone.startMilliseconds)}</td>
		  <td className="endms">{fmtTime(this.props.osc.zone.endMilliseconds)}</td>
		   {this.state.openned ? (<td><Dropdown options={loopModeTab} onChange={this.onLoopSelect.bind(this)} value={defaultOption} /></td>)
							: (<td className="loopMode">{defaultOption}</td>)}
		  <td><audio controls className="smallplayer" preload="none"><source src={'/' + this.props.osc.fileName} type="audio/wav" /></audio></td>
		</tr>
		{this.state.openned ? (<WaveView key='wview' osc={this.props.osc} selectionUpdate={this.selectionUpdate.bind(this)} />) : null}
   </React.Fragment>)
  }
};


@observer class KitEntry extends React.Component {

  render() {
	return (<tbody>
	<SampleEntry className='kitentry' kito={this.props.kito} index={this.props.index} name={this.props.name} key='osc1' osc={this.props.osc1} />
	</tbody>)
  }
};


@observer class KitList extends React.Component {
  render() {

	return (
	<table className='kit_tab'><thead>
 	<tr className='kithead'>
	<th className='kit_opener xmltab' kititem='-1'>►</th>
	<th>Name</th>
	<th>Path</th>
	<th>Start</th>
	<th>End</th>
	<th>Mode</th>
	<th>Player</th>
	</tr></thead>
	{this.props.kitList.map((line, ix) =>{
		return <KitEntry index={ix} key={ix} kito={line} {...line} />
	})}
	</table>
	);
  }
};

class KitView {
	constructor(context) {
		this.context = context;
		this.kitObj = context.kitObj;
		this.jqElem = context.jqElem;
	}

	render() {
		this.kitElem = React.createElement(KitList, this.context);
		ReactDOM.render(this.kitElem, this.jqElem);
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
