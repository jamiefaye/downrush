import React from 'react';
import {forceArray} from './JsonXMLUtils.js';

function MidiKnob(props) {
	if (!props.sound || !props.sound.midiKnobs || !props.sound.midiKnobs.midiKnob) return null;
	let mka = forceArray(props.sound.midiKnobs.midiKnob);

	return (<table className='midi_mod_knobs xmltab'><tbody>
	<tr><th colSpan='4'>Midi Parameter Mapping</th></tr>
	<tr><th>Channel</th><th>CC #</th><th>Rel</th><th>Controls</th></tr>
	{mka.map((k)=>{
		return (<tr>
		<td>{k.channel}</td>
		<td>{k.ccNumber}</td>
		<td>{k.relative}</td>
		<td>{k.controlsParam}</td>
		</tr>)
	})}
	</tbody></table>);
}

export {MidiKnob};