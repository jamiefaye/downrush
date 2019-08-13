import {AudioView} from "./WaveView.jsx";
import $ from 'jquery';
import React from 'react';
import {WedgeIndicator2, PlayerControl} from "./GUIstuff.jsx";


class AudioTrackView extends React.Component {
  constructor(props) {
	super(props);
	this.state = {
		open: false,
		pushed: false,
	}
	
	this.waveProps = {height: 128, splitChannels: false};
	this.toggler = this.toggler.bind(this);
	this.command = this.command.bind(this);
	this.audioViewRef = React.createRef();
  }

  toggler() {
	this.setState({open: !this.state.open});
  }


  command(cmd, evt) {
	this.audioViewRef.current.command(cmd, evt);
  }
/*

	<Icon2PushButton className='plsybut' title='Play' pushed={this.props.pushed}
		onPush={(e)=>{this.props.command('play', e, this)}}
		
*/
  render() {
	let track = this.props.track;
	let me = this;

	return <table><tbody><tr>
		<td><div style= {{width: '26px'}}>
		<PlayerControl pushed={this.state.pushed} command={(e)=>{this.command('play', e)}}/>
		<p/>
		<WedgeIndicator2 opened={this.state.open} toggler={this.toggler} />
		</div></td>
		<td>
		{<AudioView ref={me.audioViewRef}  filename={track.filePath} track={track} open={this.state.open} waveprops={this.waveProps} />}
		</td></tr></tbody></table>; 
	
//	return <AudioView filename={track.filePath} track={track} open={this.state.open} waveprops={this.waveProps} />
  }
}


export {AudioTrackView};
