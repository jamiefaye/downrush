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
import {getXmlDOMFromString, xmlToJson, reviveClass} from './JsonXMLUtils.js';
import shortid from 'shortid';
import {WedgeIndicator, IconPushButton, PushButton, CopyToClipButton, PasteTarget} from './GUIstuff.jsx';

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

class Checkbox extends React.Component {
	constructor(props) {
		super(props);
		this.state = {checked: false};
	}

	render() {
		return (<input className='achkbox' type='checkbox' checked={this.state.checked} onClick={e=>{
			let newState = !this.state.checked;
			this.setState({checked: newState});
			this.props.checker(this, newState);
		}}></input>);
	
	}
}

class PlayerControl extends React.Component {
  render() {
	return (
	<IconPushButton className='plsybut' title='Play'
		onPush={(e)=>{this.props.command('play', e)}}
		src='img/glyphicons-174-play.png'/>)
  }
};

class EditButtons extends React.Component {
  render() {
	return (<React.Fragment>
	<td><Checkbox checker={this.props.checker} /></td>
	<td>↕</td>
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
	if (this.props.editing) {
		let newZone = {startMilliseconds: Math.round(b * 1000) , endMilliseconds: Math.round(e * 1000)};
		this.props.osc.zone = newZone;
	}
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
  	console.log("Name select: " + item.value);
	this.props.kito.name = item.value;
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
   let openEditing = this.props.editing && this.state.opened;
   return (<React.Fragment>
		<tr className="kitentry" key='sinfo'>
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator opened={this.state.opened} toggler={e=>{this.setState((prevState, props) =>{
		  	return  {opened: !prevState.opened}})}}/></td>
		  {this.props.editing ? (<EditButtons checker={this.props.checker}/>) : null}
		  {openEditing ? (<td><Dropdown options={KIT_SOUND_NAMES} onChange={(item)=>{this.onNameSelect(item)}} value={this.props.name} /></td>)
		  					  :  <td>{this.props.name}</td>}
		  {openEditing ? (<td style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)
		  					  : (<td style={{textAlign: 'left'}}>{this.props.osc.fileName}</td>)}
	  	  <td className="startms">{fmtTime(this.props.osc.zone.startMilliseconds)}</td>
		  <td className="endms">{fmtTime(this.props.osc.zone.endMilliseconds)}</td>
		   {openEditing ? (<td><Dropdown options={loopModeTab} onChange={this.onLoopSelect.bind(this)} value={defaultOption} /></td>)
							: (<td className="loopMode">{defaultOption}</td>)}
		  <td><PlayerControl command={(e)=>{this.command('play', e)}}/></td>
		</tr>
		<WaveView key='wview' ref={el => this.waveViewRef = el} open={this.state.opened} editing={openEditing} osc={this.props.osc} filename={this.props.osc.fileName} selectionUpdate={this.selectionUpdate.bind(this)} />
   </React.Fragment>)
  }
};


@observer class KitEntry extends React.Component {

	constructor(props) {
		super(props);
		this.selected = new Set();
		this.checker = this.checker.bind(this);
	}

  checker(which, state) {
	this.props.informCheck(this, which, state);
  }
 
  render() {
	return (<tbody>
	<SampleEntry className='kitentry' ref={el => this.kitref = el} kito={this.props.kito} checker={this.checker}
		editing={this.props.editing} index={this.props.index} name={this.props.name} key='osc1' osc={this.props.osc1} />
	</tbody>)
  }
};



@observer class KitList extends React.Component {
  constructor(props) {
  	super(props);

  	this.state = {};
  	this.informCheck = this.informCheck.bind(this);
  	this.selected = new Set();
  }

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

  informCheck(entry, box, state) {
	if (state) {
		this.selected.add(entry.props.kito);
		console.log("Added entry " + entry.props.keyValue);
	} else {
		this.selected.delete(entry.props.kito);
		console.log("Removed entry " + entry.props.keyValue);
	}
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
	 <th className="edit_open"><WedgeIndicator opened={this.state.editOpened} toggler={e=>{this.setState((prevState, props) =>{
		return  {editOpened: !prevState.editOpened}})}}/></th>
	{this.state.editOpened ? (<th colSpan='2'></th>) : null}
	<th>Name</th>
	<th>Path</th>
	<th>Start</th>
	<th>End</th>
	<th>Mode</th>
	<th>Player</th>
	</tr></thead>
	{this.props.kitList.map((line, ix) =>{
		return <KitEntry index={ix} key={line.uniqueId} keyValue={line.uniqueId} kito={line} {...line} editing={this.state.editOpened} informCheck={this.informCheck}/>
	})}
	{this.state.editOpened ? (
		<tbody>
		<tr>
		<td colSpan='10'>
		<PushButton title='Add Sample' onPush={this.newDrum.bind(this)}/>
		<PushButton title='Change' onPush={this.changeFile.bind(this)}/>
		<CopyToClipButton title='Copy' getText={this.copySel.bind(this)} />
		<PushButton title='Delete' onPush={this.deleteSel.bind(this)}/>
		<PasteTarget label=' Paste kits: ' paste={this.handlePaste.bind(this)}/>
		</td>
		</tr>
		</tbody>
	) : null}
	</table>
	);
  }

  handlePaste(text) {
  	let pastedIn = JSON.parse(text, reviveClass);
  	if (!pastedIn.sound) return;
  	this.props.kitList.push(...pastedIn.sound);
  	
	console.log(text);
  }

  changeFile(e) {
	let selList = [...this.selected];
	if (selList.length === 0) return;

	let toChange = selList[0];
	

  	let initial = toChange.osc1.fileName;
  	if (!initial.startsWith('/')) initial = '/' + initial;
	if (!initial) initial = '/';
	let me = this; 
	openFileBrowser({
		initialPath:  initial,
		opener: function(name) {
			toChange.osc1.fileName = name.startsWith('/') ? name.substring(1) : name;
			toChange.osc1.zone.endMilliseconds = -1;	// trigger recalc of zone.
		}
	});
  }

  deleteSel() {
	for (let k of this.selected) {
		let ix = this.props.kitList.indexOf(k);
		if (ix >= 0) {
			this.props.kitList.splice(ix, 1);
		}
	}
  }

  copySel() {
	let copyList = [...this.selected];
	let clipObj = {sound: copyList};
	let asText = JSON.stringify(clipObj, null, 1);
	return asText;
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
