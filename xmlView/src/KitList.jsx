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
import {empty_sound_template} from './templates.js';
import {getXmlDOMFromString, xmlToJson} from './JsonXMLUtils.js';

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
	{props.opened ? '▼' : '►'}
	</span>);
}

@observer class PlayerControl extends React.Component {
/*
  render() {
  console.log("PlayerControl " + this.props.fileName);
	return <audio controls className="smallplayer" preload="none"><source src={'/' + this.props.fileName} type="audio/wav" /></audio>;
  }
*/
   render() {
    return (<React.Fragment>
	<button className='butn plsybut' title='Play'><img width='16px'height='18px' className='playbutimg' onClick={(e)=>{this.props.command('play', e)}} src='img/glyphicons-174-play.png'/></button>
   </React.Fragment>);
	}
};


@observer class SampleEntry extends React.Component {
  constructor(props) {
	super();
	// We use an endMilliseconds == -1 as a trigger flag to cause the WaveView to update the selection immediately
	// with actual valid data. It also serves as indicator to open the WaveView initially.
	this.state = {
		opened: Number(props.osc.zone.endMilliseconds) === -1,
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
  	//console.log(item.value);
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
			me.props.osc.zone.endMilliseconds = -1; // trigger recalc of zone.
		}
	});
  }

  command(name, val) {
	if(!this.waveViewRef) {
		console.log("Trouble!");
	} else {
		this.waveViewRef.command(name, val);
	}
  }

  render() {
   const defaultOption = loopModeTab[this.props.osc.loopMode];
   return (<React.Fragment>
		<tr className="kitentry" key='sinfo'>
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator opened={this.state.opened} toggler={e=>{this.setState((prevState, props) =>{
		  	return  {opened: !prevState.opened}})}}/></td>
		  {this.state.opened ? (<td><Dropdown options={KIT_SOUND_NAMES} onChange={(item)=>{this.onNameSelect(item)}} value={this.props.name} /></td>)
		  					  :  <td>{this.props.name}</td>}
		  {this.state.opened ? (<td onClick={this.onChangeFilePath.bind(this)} style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)
		  					  : (<td style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)}
	  	  <td className="startms">{fmtTime(this.props.osc.zone.startMilliseconds)}</td>
		  <td className="endms">{fmtTime(this.props.osc.zone.endMilliseconds)}</td>
		   {this.state.opened ? (<td><Dropdown options={loopModeTab} onChange={this.onLoopSelect.bind(this)} value={defaultOption} /></td>)
							: (<td className="loopMode">{defaultOption}</td>)}
		  <td><PlayerControl fileName={this.props.osc.fileName} command={(e)=>{this.command('play', e)}}/></td>
		</tr>
		<WaveView key='wview' ref={el => this.waveViewRef = el} open={this.state.opened} osc={this.props.osc} filename={this.props.osc.fileName} selectionUpdate={this.selectionUpdate.bind(this)} />
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
  newDrum(e) {
    
	if (!this.browsePath) this.browsePath = '/SAMPLES/';
	let me = this; 
	openFileBrowser({
		initialPath:  this.browsePath,
		opener: function(name) {
			me.browsePath = name;
			me.addDrum(name);
		}
	});
  }

  addDrum(name) {
	if(name.startsWith('/')) { 
	name = name.slice(1);
	}
	let filledSoundT = empty_sound_template({fileName: name, name: 'USER'});
	let newDrumX = getXmlDOMFromString(filledSoundT);
	let newSound = xmlToJson(newDrumX).sound;
	this.props.kitList.push(newSound);
	// this.forceUpdate();
  }
 
  render() {

	return (
	<table className='kit_tab'><thead>
 	<tr className='kithead'>
	<th className='kit_opener xmltab' kititem='-1' onClick={this.newDrum.bind(this)}>+</th>
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
	let kitList = json.soundSources.sound; // forceArray(json.soundSources.sound);
	let context = {};
	context.kitList = kitList;
	context.sample_path_prefix = sample_path_prefix;
	context.jqElem =  where;
	let kitView = new KitView(context);
	kitView.render();
}

export {KitList, formatKit};
