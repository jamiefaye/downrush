import React from 'react';
import {forceArray} from './JsonXMLUtils.js';
function ModKnobs(props) {
  if (!props) return null;
  if (!props.sound) return null;
  if (!props.sound.modKnobs) return null;
  if (!props.sound.modKnobs.modKnob) return null;

  let kd = forceArray(props.sound.modKnobs.modKnob).map((o)=>o.controlsParam);
 return (
<table className='mod_knobs xmltab'>
<tr>
<th className='mkhead' colspan='8'>Parameter Knob Mapping</th>
</tr>
<tr>
<th className='mkhead'>Volume</th>
<th className='mkhead'>Cutoff/FM</th>
<th className='mkhead'>Attack</th>
<th className='mkhead'>Delay Time</th>

<th className='mkhead'>Sidechain</th>
<th className='mkhead'>Mod Rate</th>
<th className='mkhead'>Stutter</th>
<th className='mkhead'>Custom 2</th>
</tr>
<tr>
<td className='mkhdata'>{kd[1]}</td>
<td className='mkhdata'>{kd[3]}</td>
<td className='mkhdata'>{kd[5]}</td>
<td className='mkhdata'>{kd[7]}</td>

<td className='mkhdata'>{kd[9]}</td>
<td className='mkhdata'>{kd[11]}</td>
<td className='mkhdata'>{kd[13]}</td>
<td className='mkhdata'>{kd[15]}</td>
</tr>
<tr>
<th className='mkhead'>Pan</th>
<th className='mkhead'>Res/FM</th>
<th className='mkhead'>Release</th>
<th className='mkhead'>Amount</th>

<th className='mkhead'>Reverb</th>
<th className='mkhead'>Depth</th>
<th className='mkhead'>Custom 1</th>
<th className='mkhead'>Custom 3</th>
</tr>
<tr>
<td className='mkhdata'>{kd[0]}</td>
<td className='mkhdata'>{kd[2]}</td>
<td className='mkhdata'>{kd[4]}</td>
<td className='mkhdata'>{kd[6]}</td>

<td className='mkhdata'>{kd[8]}</td>
<td className='mkhdata'>{kd[10]}</td>
<td className='mkhdata'>{kd[12]}</td>
<td className='mkhdata'>{kd[14]}</td>
</tr>
</table>
);
} // functional component.

export {ModKnobs};
