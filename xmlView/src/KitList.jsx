import React from 'react';
import ReactDOM from "react-dom";
import Dropdown from 'react-dropdown';
import {WaveView, SampleView} from './WaveView.jsx';
import {openFileBrowser} from './FileBrowser.js';
import {forceArray} from "./JsonXMLUtils.js";
import {getXmlDOMFromString, xml3ToJson, reviveClass} from './JsonXMLUtils.js';
import shortid from 'shortid';
import {WedgeIndicator, IconPushButton, Icon2PushButton, PushButton, Checkbox, PlayerControl, CopyToClipButton, PasteTarget} from './GUIstuff.jsx';
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';
import TextInput from 'react-autocomplete-input';
import {SoundTab} from './SoundTab.jsx';
import $ from 'jquery';
import {getSamplePathPrefix} from "./samplePath.js";
import {empty_sound_temp} from './templates.js';

var local_exec = document.URL.indexOf('file:') == 0;

function fmtTime(tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
}

function forceString(val) {
	if (val === undefined) return "";
	if (typeof val === 'string' || val instanceof String) return val;
	return "";
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

// Borrowed from the Python script with a few ambigious digraphs omitted.
var pbd = ["KICK","kick","Kick","Bassdrum"];
var psd = ["snare","SNARE","Snare"];
var poh = ["Ohh","ophihat","Hhopen","hihatopen","open_hi_hat","Hatop","open_hi_hat","Hat_Open"];
var pch = ["hihat","cl_hat","Hhclose","hihatclosed","hi_hat","closed_hi_hat","Hatclosed","hi_hat","Hat_Closed"];

function matchList(list, path)
{
	for(let i = 0; i < list.length; ++i) {
		if(path.indexOf(list[i]) >= 0) return true;
	}
	return false;
}


function suggestName(path) {
	if(matchList(pbd, path)) return 'KICK';
	if(matchList(psd, path)) return 'SNARE';
	if(matchList(poh, path)) return 'HATO';
	if(matchList(pch, path)) return 'HATC';

	let parts = path.split('/');
	if (parts.length === 0) return 'USER';
	let lastP = parts.pop();
	let upName = lastP.substring(0, 4).toUpperCase();
	upName = upName.replace('.','');
	return upName;
}

const DragHandle = SortableHandle(() => <span>::</span>); // This can be any component you want ↕

class EditButtons extends React.Component {
  render() {
	return (<React.Fragment>
	<td><DragHandle/></td>
	<td><Checkbox checker={this.props.checker} /></td>
	</React.Fragment>);

  }
};

class SampleEntry extends React.Component {
  constructor(props) {
	super();
	
	let opend = false;
	if (props.osc && props.osc.zone) {
		opend = Number(props.osc.zone.endMilliseconds) === -1
	}
	// We use an endMilliseconds == -1 as a trigger flag to cause the WaveView to update the selection immediately
	// with actual valid data. It also serves as indicator to open the WaveView initially.
	this.state = {
		opened: opend,
		pushed: false,
		showTab: false,
	};
	this.toggleTab = this.toggleTab.bind(this);

  }

  selectionUpdate(b, e) {
	if (this.props.editing) {
		let newZone = {startMilliseconds: Math.round(b * 1000) , endMilliseconds: Math.round(e * 1000)};
		this.props.osc.zone = newZone;
		this.forceUpdate();
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

  onNameSelect(name) {
	console.log("Name select: " + name);
	this.props.kito.name = name;
	this.forceUpdate();
  }

  command(name, val) {
	if(!this.waveViewRef) {
		console.log("Trouble!");
	} else {
		this.waveViewRef.command(name, val, this);
	}
  }

  setPlayState(toState) {
	this.setState({pushed: toState});
  }

  toggleTab() {
  	this.setState({showTab: !this.state.showTab});
  }



  render() {
	const defaultOption = loopModeTab[this.props.osc.loopMode];
	let openEditing = this.props.editing && this.state.opened;
	let osc = this.props.osc;
	let hasSample = osc.fileName && !$.isEmptyObject(osc.fileName);
	let showPlayButton = hasSample && !local_exec;
	let showAudioControl = hasSample && local_exec;
	let showWaveView = showPlayButton;
	let soundGridOnly = !hasSample || showAudioControl;
	let startTS = "";
	let endTS = "";
	let oldZone = this.props.osc.zone.startMilliseconds !== undefined;
	if (hasSample) {
		if (oldZone) {
			startTS = fmtTime(this.props.osc.zone.startMilliseconds);
			endTS = fmtTime(this.props.osc.zone.endMilliseconds);
		} else {
			startTS = this.props.osc.zone.startSamplePos;
			endTS = this.props.osc.zone.endSamplePos;
		}
	}
   return (<React.Fragment>
		<tr className="kitentry unselectable" key='sinfo'>
		  {this.props.editing ? (<EditButtons checker={this.props.checker}/>) : null}
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator opened={this.state.opened} toggler={e=>{this.setState((prevState, props) =>{
		  	return  {opened: !prevState.opened}})}}/></td>
		  {openEditing && !this.props.osc2 ? (<td><div className='autocompletediv'><TextInput options={KIT_SOUND_NAMES} onChange={(item)=>{this.onNameSelect(item)}} 
			rows='1' cols='10' offsetX={120}
			trigger='' defaultValue={this.props.name}/></div></td>)
			 : this.props.osc2 ? <td> </td> : <td>{this.props.name}</td>}
		  {openEditing ? (<td style={{textAlign: 'left'}}>{forceString(this.props.osc.fileName)}</td>)
		  					  : (<td style={{textAlign: 'left'}}>{forceString(this.props.osc.fileName)}</td>)}
	  	  <td className="startms">{startTS}</td>
		  <td className="endms">{endTS}</td>
		   {openEditing ? (<td><Dropdown options={loopModeTab} onChange={this.onLoopSelect.bind(this)} value={defaultOption} /></td>)
							: (<td className="loopMode">{defaultOption}</td>)}
		  {showPlayButton ? (<td><PlayerControl pushed={this.state.pushed} command={(e)=>{this.command('play', e)}}/></td>) : 
			showAudioControl ? (<td><audio controls preload='none'><source src={getSamplePathPrefix() + this.props.osc.fileName} type='audio/wav'/></audio></td>)
							 :(<td> </td>)}
		</tr>
		{showWaveView ? (<SampleView key='wview' ref={el => this.waveViewRef = el} open={this.state.opened} editing={openEditing}
		 toggleTab={this.toggleTab} showTab={this.state.showTab}
			osc={this.props.osc} filename={this.props.osc.fileName} selectionUpdate={this.selectionUpdate.bind(this)}
		 />) : null}
		 {this.state.opened && (this.state.showTab || soundGridOnly)  ? (<tr><td colSpan={openEditing ? 9 : 7}><SoundTab sound={this.props.kito}/></td></tr>) : null}
   </React.Fragment>)
  }
};


class KitEntry extends React.Component {

	constructor(props) {
		super(props);
		this.selected = new Set();
		this.checker = this.checker.bind(this);
	}

  checker(which, state) {
	this.props.informCheck(this, which, state);
  }

  renderMidi() {
	let span = this.props.editing ? 6 : 4;
	let chanNum = Number(this.props.channel) + 1;
	let noteVal = this.props.note;
	return (<tbody>
	<tr className="kitentry unselectable" key='sinfo'>
	{this.props.editing ? (<EditButtons checker={this.props.checker}/>) : null}	
	<td> </td>
	<td> </td>
	{noteVal === undefined ? (<td>CV Gate: {chanNum}</td>) : (<td>Midi channel: {chanNum} note: {this.props.note}</td>)}
	<td colSpan={span}> </td>
	</tr>
	</tbody>);
  }

  render() {
	if (this.props.channel) return this.renderMidi();
	let o2 = this.props.osc2;
	let hasB = o2 && o2.fileName && !$.isEmptyObject(o2.fileName);
	return (<tbody>
	<SampleEntry className='kitentry' ref={el => this.kitref = el} kito={this.props.kito} checker={this.checker} osc2={false}
		editing={this.props.editing} index={this.props.index} name={this.props.name} key='osc1' osc={this.props.osc1} />
		{hasB ? (<SampleEntry className='kitentry' ref={el => this.kitref = el} kito={this.props.kito} checker={this.checker} osc2={true}
			editing={this.props.editing} index={this.props.index} name={this.props.name} key='osc2' osc={this.props.osc2} />) : null}
	</tbody>)
  }
};

const SortableKitEntry = SortableElement(KitEntry);

class KitList extends React.Component {
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
		multi:	true,
		opener: function(nameList) {
		for (let x in nameList) {
				let name = nameList[x];
				me.browsePath = name;
				me.addDrum(name);
			}
		}
	});
  }

  informCheck(entry, box, state) {
	if (state) {
		this.selected.add(entry.props.kito);
	//	console.log("Added entry " + entry.props.keyValue);
	} else {
		this.selected.delete(entry.props.kito);
	//	console.log("Removed entry " + entry.props.keyValue);
	}
  }

  addDrum(name) {
	if(name.startsWith('/')) { 
		name = name.slice(1);
	}
	let suggestion = suggestName(name);
	let temp = empty_sound_temp.split('{{fileName}}');
	let temp2 = temp.join(name);
	let temp3 = temp2.split('{{name}}');
	let filledSoundT = temp3.join(suggestion);
	let newDrumX = getXmlDOMFromString(filledSoundT);
	let newSound = xml3ToJson(newDrumX).sound;
	this.props.kitList.push(newSound);
	this.forceUpdate();
  }

  render() {

	return (
	<table className='kit_tab'><thead>
 	<tr className='kithead'>
 	{this.state.editOpened ? (<th colSpan='2'></th>) : null}
	 <th className="edit_open"><WedgeIndicator opened={this.state.editOpened} toggler={e=>{this.setState((prevState, props) =>{
		return  {editOpened: !prevState.editOpened}})}}/></th>
	<th>Name</th>
	<th>Path</th>
	<th>Start</th>
	<th>End</th>
	<th>Mode</th>
	<th> </th>
	</tr></thead>
	{this.props.kitList.map((line, ix) =>{
		return <SortableKitEntry index={ix} key={line.uniqueId} keyValue={line.uniqueId} kito={line} {...line} editing={this.state.editOpened} informCheck={this.informCheck}/>
	})}
	{this.state.editOpened ? (
		<tbody>
		<tr className='kithead'>
		<td colSpan='10'>
		<PushButton title='Add Samples' onPush={this.newDrum.bind(this)}/>
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
  	this.forceUpdate();
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
		opener: function(nameList) {
			let name = nameList[0];
			toChange.osc1.fileName = name.startsWith('/') ? name.substring(1) : name;
			toChange.osc1.zone.endMilliseconds = -1;	// trigger recalc of zone.
			me.forceUpdate();
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
	this.forceUpdate();
  }

  copySel() {
	let copyList = [...this.selected];
	let clipObj = {sound: copyList};
	let asText = JSON.stringify(clipObj, null, 1);
	return asText;
  }
};


const SortableKitList = SortableContainer(KitList);


class KitListView extends React.Component {
  constructor(props) {
  	super(props);
  	this.onSortEnd = this.onSortEnd.bind(this);
  }

 onSortEnd(move, evt) {
  	let {oldIndex, newIndex} = move;
  	let kitList = this.props.kitList;
	if (oldIndex !== newIndex) {
		// console.log("Moving: " + oldIndex + " to: " + newIndex);
		let movee = kitList[oldIndex];
		kitList.splice(oldIndex, 1);
		kitList.splice(newIndex, 0, movee);
		this.forceUpdate();
	}
  }

  render() {
  	return <SortableKitList kitList={this.props.kitList} sample_path_prefix = {getSamplePathPrefix()} onSortEnd={this.onSortEnd} useDragHandle={true} />
  }
}

class KitView {
  constructor(context) {
		this.context = context;
		this.jqElem = context.jqElem;
		this.kitList = context.kitList;
		context.onSortEnd = this.onSortEnd.bind(this);
  }

  onSortEnd(move, evt) {
  	let {oldIndex, newIndex} = move;
	if (oldIndex !== newIndex) {
		// console.log("Moving: " + oldIndex + " to: " + newIndex);
		let movee = this.kitList[oldIndex];
		this.kitList.splice(oldIndex, 1);
		this.kitList.splice(newIndex, 0, movee);
		this.render();
	}
  }

  render() {
		this.kitElem = React.createElement(SortableKitList, this.context);
		ReactDOM.render(this.kitElem, this.jqElem);
  }
};



function formatKit(kitList, where) {
	if (!kitList) return;
	let context = {};
	context.kitList = kitList;
	context.sample_path_prefix = getSamplePathPrefix();
	context.useDragHandle = true;
	context.jqElem =  where;
	let kitView = new KitView(context);
	kitView.render();
}

export {KitList, formatKit, KitListView};
