import React from 'react';
import {forceArray} from "./JsonXMLUtils.js";
import {sample_path, tonotename, fmttime2} from './FmtSound.js';

function SampleRangeEntry(props) {
  let sr = props.range;
  return (
  <tbody>
	<tr><td className='sampfile samplen' style={{textAlign: 'left'}} colspan='10'>{sr.fileName}</td><td className='sampfile samplen' colspan='6' rowspan='3'><audio controls preload='none'><source src={props.spath + sr.fileName} type='audio/wav'/></audio></td></tr>
	<tr><th className='samplen'>Top Note</th>
	<th className='samplen'>Note #</th>
	<th className='samplen'>Start Sample</th>
	<th className='samplen'>End Sample</th>
	<th className='samplen'>Transpose</th>
	<th className='samplen'>Cents</th>
	<th className='samplen' colspan='4' rowspan='2'> </th>
	</tr>
	<tr>
	<td className='samplenb'>{tonotename(sr.rangeTopNote)}</td>
	<td className='samplenb'>{sr.rangeTopNote}</td>
	<td className='samplenb'>{sr.zone ? sr.zone.startSamplePos : null}</td>
	<td className='samplenb'>{sr.zone ? sr.zone.endSamplePos : null}</td>
	<td className='samplenb'>{sr.transpose}</td>
	<td className='samplenb'>{sr.cents}</td></tr>
  </tbody>);
}

function SampleFileEntry(props) {
  let osc = props.osc;
  if (!osc) return null;
  
  let oscFN = osc.fileName;
  if (oscFN === undefined) return null;
  if ((typeof oscFN === 'string' || oscFN instanceof String) && oscFN.length > 0) {
	return (
		<tr>
		<td className='sampfile sample1' style={{textAlign: 'left'}} colspan='8'>{oscFN}</td>
		<td className='sample1'>{fmttime2(osc.zone.startMilliseconds, osc.zone.startSamplePos)}</td>
		<td className='sample1'>{fmttime2(osc.zone.endMilliseconds, osc.zone.endSamplePos)}</td>
		<td className='sampfile sample1' colspan='6'><audio controls preload='none'><source src={props.spath + oscFN} type='audio/wav'/></audio></td>
	</tr>);
  }
  return null;
}


function SampleRange(props) {

  let s = props.sound;
  let osc1 = s.osc1;
  let o1sr = [];
  let spath = sample_path();
  if (osc1 && osc1.sampleRanges) {
  	o1sr = forceArray(osc1.sampleRanges.sampleRange);
  }
  let osc2 = s.osc2;
  let o2sr = [];

  if(osc2 && osc2.sampleRanges) {
	o2sr = forceArray(osc2.sampleRanges.sampleRange);
  }

  return (<React.Fragment>
  	{o1sr.map((sr)=>{
		return <SampleRangeEntry range={sr} spath={spath}/>;
	})}
	{o1sr.length === 0 ? <SampleFileEntry spath={spath} osc={osc1}/> : null}

  	{o2sr.map((sr)=>{
		return <SampleRangeEntry range={sr} spath={spath}/>;
	})}
	{o2sr.length === 0 ? <SampleFileEntry spath={spath} osc={osc2}/> : null}
</React.Fragment>);
}

export {SampleRange};