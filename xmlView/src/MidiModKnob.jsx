import React from 'react';
import {fmtMidiCC} from './FmtSound.js';

function MidiModKnob(props) {
	if (!props.sound.modKnobs || !props.sound.modKnobs.modKnob) return null;
	let mka = props.sound.modKnobs.modKnob, obj;

  return (<table className='midi_mod_knobs xmltab'>
	<tr>
	<th className='midimh' colspan='16'>Knob to Midi CC Parameter Mapping</th>
	</tr>
	<tr>
	<th className='midimh' colspan = '2'>Volume</th>
	<th className='midimh' colspan = '2'>Cutoff/FM</th>
	<th className='midimh' colspan = '2'>Attack</th>
	<th className='midimh' colspan = '2'>Delay Time</th>
	
	<th className='midimh' colspan = '2'>Sidechain</th>
	<th className='midimh' colspan = '2'>Mod Rate</th>
	<th className='midimh' colspan = '2'colspan = '2'>Stutter</th>
	<th className='midimh' colspan = '2'>Custom 2</th>
	</tr>
	
	<tr>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	</tr>
	
	<tr>
	<td>{mka[1].cc}</td><td>{fmtMidiCC(mka[1].value)}</td>
	<td>{mka[3].cc}</td><td>{fmtMidiCC(mka[3].value)}</td>
	<td>{mka[5].cc}</td><td>{fmtMidiCC(mka[5].value)}</td>
	<td>{mka[7].cc}</td><td>{fmtMidiCC(mka[7].value)}</td>
	
	<td>{mka[9].cc}</td><td>{fmtMidiCC(mka[9].value)}</td>
	<td>{mka[11].cc}</td><td>{fmtMidiCC(mka[11].value)}</td>
	<td>{mka[13].cc}</td><td>{fmtMidiCC(mka[13].value)}</td>
	<td>{mka[15].cc}</td><td>{fmtMidiCC(mka[15].value)}</td>
	</tr>
	<tr>
	<th className='midimh' colspan = '2'>Pan</th>
	<th className='midimh' colspan = '2'>Res/FM</th>
	<th className='midimh' colspan = '2'>Release</th>
	<th className='midimh' colspan = '2'>Amount</th>
	
	<th className='midimh' colspan = '2'>Reverb</th>
	<th className='midimh' colspan = '2'>Depth</th>
	<th className='midimh' colspan = '2'>Custom 1</th>
	<th className='midimh' colspan = '2'>Custom 3</th>
	</tr>
	<tr>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	<th className='midismh'>CC</th><th className='midismh'>Value</th>
	</tr>
	<tr>
	<td>{mka[0].cc}</td><td>{fmtMidiCC(mka[0].value)}</td>
	<td>{mka[2].cc}</td><td>{fmtMidiCC(mka[2].value)}</td>
	<td>{mka[4].cc}</td><td>{fmtMidiCC(mka[4].value)}</td>
	<td>{mka[6].cc}</td><td>{fmtMidiCC(mka[6].value)}</td>
	
	<td>{mka[8].cc}</td><td>{fmtMidiCC(mka[8].value)}</td>
	<td>{mka[10].cc}</td><td>{fmtMidiCC(mka[10].value)}</td>
	<td>{mka[12].cc}</td><td>{fmtMidiCC(mka[12].value)}</td>
	<td>{mka[14].cc}</td><td>{fmtMidiCC(mka[14].value)}</td>
	</tr>
	</table>);
}

export {MidiModKnob}