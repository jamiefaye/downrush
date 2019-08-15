import $ from 'jquery';
import React from 'react';
import {MidiKnob} from './MidiKnob.jsx';
import {MidiModKnob} from './MidiModKnob.jsx';
import {ModKnobs} from './ModKnobs.jsx';
import {SoundGrid} from './SoundGrid.jsx';


class SoundTab extends React.Component {
  render() {
  	let sound = this.props.sound;
	return <div>
		<ModKnobs sound={sound}/>
		<MidiKnob sound={sound}/>
		<SoundGrid sound={sound}/>
	</div>
  }
};

export {SoundTab};
