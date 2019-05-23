import React from 'react';
import {SampleRange} from './SampleRange.jsx';
import {binaryIndexOf, convertHexTo50, fixh, fixm50to50, fixpan, fixphase, fixpos50,
	fixrev, fmtMidiCC, fmtmoddest, fmtonoff, fmtprior, fmtscattack, fmtscrelease,
	fmtsync, fmttime, fmttransp, sample_path, tonotename} from './FmtSound.js';
import {forceArray} from "./JsonXMLUtils.js";

class ShrinkIfNeeded extends React.Component {

  render() {
	let s = this.props.str;
	if(s === undefined) return "";
	if (s.length <= 6) {
		return s;
	}
	return <div class='textsm2'>{s}</div>;
  }
}

class SoundGrid extends React.Component {

  overlayRouting(sound) {
  	// Populate mod sources fields with specified destinations
	if (sound.patchCables) {
		let destMap = {};
		let patchA = forceArray(sound.patchCables.patchCable);
		for (var i = 0; i < patchA.length; ++i) {
			let cable = patchA[i];
			let sName = "m_" + cable.source;
			let aDest = cable.destination;
			// Vibrato is represented by a patchCable between lfo1 and pitch
			if (cable.source === 'lfo1' && aDest === 'pitch') {
				let vibratoVal = fixm50to50(cable.amount);
				sound['vibrato'] = vibratoVal;
			}
			let amount = fixm50to50(cable.amount);
			let info = aDest + "(" + amount + ")";
			let val = destMap[sName];
			if (val) val += ' ';
				else val = "";
			val += info;
			destMap[sName]  = val;
		}
		
		let sndOut = Object.assign({}, sound, destMap);
		return sndOut;
		//jQuery.extend(true, sound, destMap);
	}
	return sound;
  }


  render() {

	let s = this.overlayRouting(this.props.sound);
	return (
<table className='sound_grid xmltab'>
<SampleRange sound={s} />
<tr>
<th className ='toph sample1'>Sample 1</th>
<th className ='toph sample2'>Sample 2</th>
<th className ='toph unlab' colspan='4'></th>
<th className ='toph distortion'>Distortion</th>
<th className ='toph unlab'></th>

<th className ='toph lpf hleftb'>LPF</th>
<th className ='toph hpf'>HPF</th>
<th className ='toph bass'>Bass</th>
<th className ='toph treble'>Treble</th>

<th className ='toph modfx hleftb'>Mod FX</th>
<th className ='toph reverb'>Reverb</th>
<th className ='toph unlab' colspan='2'></th>


</tr>


{/* Row 0 c1-16 */}
<tr>
<th className='zone start sample1'>Start 1</th>
<th className='zone start sample2'>Start 2</th>
<th className='unlab bbh'> </th>
<th className='unlab bbh'> </th>

<th className='unlab bbh'> </th>
<th className='unlab bbh'> </th>
<th className='distortion'>Saturation</th>
<th className='unlab bbh'> </th>

<th className='lpf frequency hleftb'>LPF Freq</th>
<th className='hpf frequency'>HPF Freq</th>
<th className='frequency bass'>Bass</th>
<th className='frequency treble'>Treble</th>

<th className='modfx hleftb'>Rate</th>
<th className='reverb'>Room Size</th>
<th className='unlab bbh'> </th>
<th className='unlab bbh'> </th>
</tr>

<tr>
<td className='zone start sample1'>{s.osc1 && s.osc1.zone ? fmttime(s.osc1.zone.startMilliseconds) : null}</td>
<td className='zone start sample2'>{s.osc2 && s.osc2.zone ? fmttime(s.osc2.zone.startMilliseconds) : null}</td>
<td className='unlab'> </td>
<td className='unlab'> </td>

<td className='unlab'> </td>
<td className='unlab'> </td>
<td className='distortion'>{s.clippingAmount}</td>
<td className='unlab'> </td>

<td className='lpf frequency hleftb'>{fixh(s.lpfFrequency)}</td>
<td className='hpf frequency'>{fixh(s.hpfFrequency)}</td>
<td className='frequency bass'>{s.equalizer? fixh(s.equalizer.bassFrequency) : null}</td>
<td className='frequency treble'>{s.equalizer? fixh(s.equalizer.trebleFrequency) : null}</td>

<td className='modfx hleftb'>{fixh(s.modFXRate)}</td>
<td className='reverb'>{s.reverb ? fixrev(s.reverb.roomSize) : null}</td>
<td className='unlab'> </td>
<td className='unlab'> </td>
</tr>

{/* Row 1 c17-32 */}


<tr>
<th className='zone end sample1'>End 1</th>
<th className='zone end sample2'>End 2</th>
<th className='noise'>Noise</th>
<th className='osc2'>Osc Sync</th>

<th className='destination fmmod1 hleftb'>Dest M 1</th>
<th className='destination fmmod2'>Dest M 2</th>
<th className='distortion'>Bitcrush</th>
<th className='unlab bbh'> </th>

<th className='lpf resonance hleftb'>LPF Reson</th>
<th className='hpf resonance'>HPF Reson</th>
<th className='bass adjust'>Adj Bass</th>
<th className='treble adjust'>Adj Treble</th>

<th className='modfx hleftb'>Depth</th>
<th className='reverb'>Dampening</th>
<th className='modsources'>Env 1</th>
<th className='modsources'>Env 2</th>
</tr>

<tr>
<td className='zone end sample1'>{s.osc1 && s.osc1.zone ? fmttime(s.osc1.zone.endMilliseconds) : null}</td>
<td className='zone end sample2'>{s.osc2 && s.osc2.zone ? fmttime(s.osc2.zone.endMilliseconds) : null}</td>
<td className='noise'>{fixh(s.noiseVolume)}</td>
<td className='osc2'>{s.osc2 && fmtonoff(s.osc2.oscillatorSync)}</td>

<td className='destination fmmod1 hleftb'> </td>
<td className='destination fmmod2'>{s.modulator2 ? fmtmoddest(s.modulator2.toModulator1) : null}</td>
<td className='distortion'>{fixh(s.bitCrush)}</td>
<td className='unlab'> </td>

<td className='lpf resonance hleftb'>{fixh(s.lpfResonance)}</td>
<td className='hpf resonance'>{fixh(s.hpfResonance)}</td>
<td className='bass adjust'>{s.equalizer ? fixh(s.equalizer.bass) : null}</td>
<td className='treble adjust'>{s.equalizer ? fixh(s.equalizer.treble) : null}</td>

<td className='modfx hleftb'>{fixh(s.modFXDepth)}</td>
<td className='reverb'>{s.reverb ? fixrev(s.reverb.dampening)  : null}</td>
<td className='textsm modsources m_envelope1'>{s.m_envelope1}</td>
<td className='textsm modsources m_envelope2'>{s.m_envelope2}</td>
</tr>

{/* Row 2 c33-48 */}
<tr>
<th className='audio browse sample1'>Browse 1</th>
<th className='audio browse sample2'>Browse 2</th>
<th className='osc1 feedback'>Feedbk 1</th>
<th className='osc2 feedback'>Feedbk 2</th>

<th className='fmmod1 feedback hleftb'>Feedbk M 1</th>
<th className='fmmod2 feedback'>Feedbk M 2</th>
<th className='distortion'>Decimation</th>
<th className='unlab bbh'> </th>

<th className='dboct lpf hleftb'>LPF dB/O</th>
<th className='dboct hpf'>HPF dB/O</th>
<th className='sidechain'>Send</th>
<th className='unlab bbh'> </th>

<th className='modfx hleftb'>Feedback</th>
<th className='reverb'>Width</th>
<th className='modsources'>LFO 1</th>
<th className='modsources'>LFO 2</th>
</tr>

<tr>
<td className='audio browse sample1'> </td>
<td className='audio browse sample2'> </td>
<td className='osc1 feedback'>{fixh(s.carrier1Feedback)}</td>
<td className='osc2 feedback'>{fixh(s.carrier2Feedback)}</td>
              
<td className='fmmod1 feedback hleftb'>{fixh(s.modulator1Feedback)}</td>
<td className='fmmod2 feedback'>{fixh(s.modulator2Feedback)}</td>
<td className='distortion'>{fixh(s.sampleRateReduction)}</td>
<th className='unlab bbh'> </th>

<td className='dboct lpf hleftb'><ShrinkIfNeeded str={s.lpfMode}/></td>
<td className='dboct hpf'><ShrinkIfNeeded str={s.hpfMode}/></td>
<td className='sidechain'>{fixrev(s.sideChainSend)}</td>
<td className='unlab'> </td>

<td className='modfx hleftb'>{fixh(s.modFXFeedback)}</td>
<td className='reverb'>{s.reverb ? fixrev(s.reverb.width) : null}</td>
<td className='textsm modsources m_lfo1'>{s.m_lfo1}</td>
<td className='textsm modsources m_lfo2'>{s.m_lfo2}</td>
</tr>

{/* Row 3 c49 to c64 */}
<tr>
<th className='audio record sample1'>Record 1</th>
<th className='audio record sample2'>Record 2</th>
<th className='osc1 retrigphase'>Retrig 1</th>
<th className='osc2 retrigphase'>Retrig 2</th>

<th className='fmmod1 hleftb retrigphase'>Retrig M 1</th>
<th className='fmmod2 retrigphase'>Retrig M 2</th>
<th className='master'>Synth Mode</th>
<th className='unison'>Unison #</th>

<th className='unlab hleftb bbh'> </th>
<th className='unlab bbh'> </th>
<th className='sidechain'>Shape</th>
<th className='arp'>Arp Mode</th>

<th className='modfx hleftb'>Offset</th>
<th className='reverb'>Pan</th>
<th className='delay'>Stereo</th>
<th className='modsources'>Sidechain</th>
</tr>

<tr>
<td className='audio record sample1'> </td>
<td className='audio record sample2'> </td>
<td className='osc1 retrigphase'>{s.osc1 ? fixphase(s.osc1.retrigPhase) : null}</td>
<td className='osc2 retrigphase'>{s.osc2 ? fixphase(s.osc2.retrigPhase) : null}</td>
              
<td className='fmmod1 retrigphase hleftb'>{s.modulator1 ? fixphase(s.modulator1.retrigPhase) : null}</td>
<td className='fmmod2 retrigphase'>{s.modulator2 ? fixphase(s.modulator2.retrigPhase) : null}</td>
<td className='master'><ShrinkIfNeeded str={s.mode}/></td>
<td className='unison'>{s.unison ? s.unison.num : null}</td>
              
<td className='unlab hleftb'> </td>
<td className='unlab'> </td>
<td className='sidechain'>{fixh(s.compressorShape)}</td>
<td className='arp'>{s.arpeggiator ? s.arpeggiator.mode : null}</td>
              
<td className='modfx hleftb'>{fixh(s.modFXOffset)}</td>
<td className='reverb'>{s.reverb? fixrev(s.reverb.pan) : null}</td>
<td className='delay'>{s.delay ? fmtonoff(s.delay.pingPong) : null}</td>
<td className='textsm modsources m_sidechain'>{s.m_sidechain}</td>
</tr>

{/* Row 4 c65-c80 */}
<tr>
<th className='sample1 pitchtime'>Pitch/T 1</th>
<th className='sample2 pitchtime'>Pitch/T 2</th>
<th className='osc1 pw'>PW 1</th>
<th className='osc2 pw'>PW 2</th>

<th className='fmmod1 pw hleftb'>PW M 1</th>
<th className='fmmod2 pw'>PW M 2</th>
<th className='master'>Master Pan</th>
<th className='unison'>Detune</th>

<th className='attack env1 hleftb'>Attack 1</th>
<th className='attack env2'>Attack 2</th>
<th className='attack sidechain'>Attack SC</th>
<th className='arp'>Arp Octs</th>

<th className='modfx hleftb'>Type</th>
<th className='reverb amount'>Reverb Amt</th>
<th className='delay amount'>Delay Amt</th>
<th className='modsources'>Note</th>
</tr>


<tr>
<td className='sample1 pitchtime'>{s.osc1 ? s.osc1.timeStretchEnable : null}</td>
<td className='sample2 pitchtime'>{s.osc2 ? s.osc2.timeStretchEnable : null}</td>
<td className='osc1 pw'>{fixpos50(s.oscAPulseWidth)}</td>
<td className='osc2 pw'>{fixpos50(s.oscBPulseWidth)}</td>
              
<td className='fmmod1 pw hleftb'> </td>
<td className='fmmod2 pw'> </td>
<td className='master'>{fixpan(s.pan)}</td>
<td className='unison'>{s.unison.detune}</td>
              
<td className='attack env1 hleftb'>{s.envelope1 ? fixh(s.envelope1.attack) : null}</td>
<td className='attack env2'>{s.envelope2 ? fixh(s.envelope2.attack) : null}</td>
<td className='attack sidechain'>{s.compressor ? fmtscattack(s.compressor.attack) : null}</td>
<td className='arp'>{s.arpeggiator ? s.arpeggiator.numOctaves : null}</td>
              
<td className='modfx hleftb'>{s.modFXType}</td>
<td className='reverb amount'>{fixh(s.reverbAmount)}</td>
<td className='delay amount'>{fixh(s.delayFeedback)}</td>
<td className='textsm modsources m_note'>{s.m_note}</td>
</tr>

{/* Row 5 c81-c96 */}
<tr>
<th className='sample1 speed'>Speed 1</th>
<th className='sample2 speed'>Speed 2</th>
<th className='osc1 type'>Type 1</th>
<th className='osc2 type'>Type 2</th>

<th className='fmmod1 type hleftb'>Type M 1</th>
<th className='fmmod2 type'>Type M 2</th>
<th className='master'>Vibrato</th>
<th className='voice'>Priority</th>

<th className='env1 decay hleftb'>Decay 1</th>
<th className='env2 decay'>Decay 2</th>
<th className='sidechain'>Vol Duck</th>
<th className='arp'>Gate</th>

<th className='lfo1 shape hleftb'>LFO 1 Shape</th>
<th className='lfo2 shape'>LFO 2 Shape</th>
<th className='delay'>Analog</th>
<th className='modsources'>Random</th>
</tr>

<tr>
<td className='sample1 speed'>{s.osc1 ? fixh(s.osc1.timeStretchAmount) : null}</td>
<td className='sample2 speed'>{s.osc2 ? fixh(s.osc2.timeStretchAmount) : null}</td>
<td className='osc1 type'>{s.osc1 ? s.osc1.type : null}</td>
<td className='osc2 type'>{s.osc2 ? s.osc2.type : null}</td>
              
<td className='fmmod1 type hleftb'> </td>
<td className='fmmod2 type'> </td>
<td className='master'>{s.vibrato}</td>
<td className='voice'>{fmtprior(s.voicePriority)}</td>
              
<td className='env1 decay hleftb'>{s.envelope1 ? fixh(s.envelope1.decay) : null}</td>
<td className='env2 decay'>{s.envelope2 ? fixh(s.envelope2.decay) : null}</td>
<td className='sidechain'>{s.compressor ? fixrev(s.compressor.volume) : null}</td>
<td className='arp'>{fixh(s.arpeggiatorGate)}</td>
              
<td className='lfo1 shape hleftb'>{s.lfo1.type}</td>
<td className='lfo2 shape'>{s.lfo2.type}</td>
<td className='delay'>{fixh(s.delay.analog)}</td>
<td className='textsm modsources m_random'>{s.m_random}</td>
</tr>

{/* Row 6 c97-112 */}
<tr>
<th className='sample1 reverse'>Reverse 1</th>
<th className='sample2 reverse'>Reverse 2</th>
<th className='osc1 transpose'>Trans 1</th>
<th className='osc2 transpose'>Trans 2</th>

<th className='fmmod1 transpose hleftb'>Trans M 1</th>
<th className='fmmod2 transpose'>Trans M 2</th>
<th className='master transpose'>Master Trans</th>
<th className='voice'>Poly</th>

<th className='env1 sustain hleftb'>Sustain 1</th>
<th className='env2 sustain'>Sustain 2</th>
<th className='sidechain'>SC Sync</th>
<th className='arp sync'>Arp Sync</th>

<th className='lfo1 sync hleftb'>LFO 1 Sync</th>
<th className='lfo2 sync'>LFO 2 Sync</th>
<th className='delay sync'>Delay Sync</th>
<th className='modsources'>Velocity</th>
</tr>

<tr>
<td className='sample1 reverse'>{s.osc1.reversed}</td>
<td className='sample2 reverse'>{s.osc2.reversed}</td>
<td className='osc1 transpose'>{fmttransp(s.osc1)}</td>
<td className='osc2 transpose'>{fmttransp(s.osc2)}</td>
              
<td className='fmmod1 transpose hleftb'>{fmttransp(s.modulator1)}</td>
<td className='fmmod2 transpose'>{fmttransp(s.modulator2)}</td>
<td className='master transpose'>{s.transpose}</td>
<td className='voice'>{s.polyphonic}</td>
              
<td className='env1 sustain hleftb'>{s.envelope1 ? fixh(s.envelope1.sustain) : null}</td>
<td className='env2 sustain'>{s.envelope2 ? fixh(s.envelope2.sustain) : null}</td>
<td className='sidechain'>{s.compressor ? fmtsync(s.compressor.syncLevel) : null}</td>
<td className='arp sync'>{s.arpeggiator ? fmtsync(s.arpeggiator.syncLevel) : null}</td>
              
<td className='lfo1 sync hleftb'>{s.lfo1 ?fmtsync(s.lfo1.syncLevel) : null}</td>
<td className='lfo2 sync'>{s.lfo2 ?fmtsync(s.lfo2.syncLevel) : null}</td>
<td className='delay sync'>{s.delay ? fmtsync(s.delay.syncLevel) : null}</td>
<td className='textsm modsources m_velocity'>{s.m_velocity}</td>
</tr>

{/* Row 7 c113-128 */}
<tr>
<th className='sample1 mode'>Mode 1</th>
<th className='sample2 mode'>Mode 2</th>
<th className='osc1 volume'>Vol 1</th>
<th className='osc2 volume'>Vol 2</th>

<th className='fmmod1 volume hleftb'>Vol M 1</th>
<th className='fmmod2 volume'>Vol M 2</th>
<th className='master volume'>Master Vol</th>
<th className='voice'>Porta</th>

<th className='env1 release hleftb'>Release 1</th>
<th className='env2 release'>Release 2</th>
<th className='sidechain release'>Release SC</th>
<th className='arp rate'>Arp Rate</th>

<th className='lfo1 rate hleftb'>LFO 1 Rate</th>
<th className='lfo2 rate'>LFO 2 Rate</th>
<th className='rate delay'>Delay Rate</th>
<th className='modsources'>Aftertouch</th>
</tr>

<tr>
<td className='sample1 mode'>{s.osc1 ? s.osc1.loopMode : null}</td>
<td className='sample2 mode'>{s.osc2 ? s.osc2.loopMode : null}</td>
<td className='osc1 volume'>{fixh(s.oscAVolume)}</td>
<td className='osc2 volume'>{fixh(s.oscBVolume)}</td>

<td className='fmmod1 volume hleftb'>{fixh(s.modulator1Amount)}</td>
<td className='fmmod2 volume'>{fixh(s.modulator2Amount)}</td>
<td className='master volume'>{fixh(s.volume)}</td>
<td className='voice'>{fixh(s.portamento)}</td>

<td className='env1 release hleftb'>{s.envelope1 ? fixh(s.envelope1.release) : null}</td>
<td className='env2 release'>{s.envelope2 ? fixh(s.envelope2.release) : null}</td>
<td className='sidechain release'>{s.compressor ? fmtscrelease(s.compressor.release) : null}</td>
<td className='arp rate'>{fixh(s.arpeggiatorRate)}</td>

<td className='lfo1 rate hleftb'>{fixh(s.lfo1Rate)}</td>
<td className='lfo2 rate'>{fixh(s.lfo2Rate)}</td>
<td className='rate delay '>{fixh(s.delayRate)}</td>
<td className='textsm modsources m_aftertouch'>{s.m_aftertouch}</td>
</tr>

<tr>
<th className ='both sample1'>Sample 1</th>
<th className ='both sample2'>Sample 2</th>
<th className ='both osc1'>Osc 1</th>
<th className ='both osc1'>Osc 2</th>

<th className ='both fmmod1 hleftb'>FM Mod 1</th>
<th className ='both fmmod2'>FM Mod 2</th>
<th className ='both master'>Master</th>
<th className ='both voice'>Voice</th>
<th className ='both env1 release hleftb'>Envelope 1</th>
<th className ='both env2 release'>Envelope 2</th>
<th className ='both sidechain'>Sidechain</th>
<th className ='both arp'>Arp</th>
<th className ='both lfo1 hleftb'>LFO 1</th>
<th className ='both lfo1'>LFO 2</th>
<th className ='toph delay'>Delay</th>
<th className ='toph modsources'>Mod Source</th>

</tr>

</table>)
} // End of render

} // End of component


export {SoundGrid};