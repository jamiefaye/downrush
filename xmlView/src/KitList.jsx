import createClass from "create-react-class";
import React from 'react';
import {WaveView} from './WaveView.jsx';

function fmtTime(tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
}

function WedgeIndicator(props) {
	return (<span className='wedge' onClick={props.toggler}>
	{props.openned ? '▼' : '►'}
	</span>);
}

class SampleEntry extends React.Component {
  constructor() {
	super();
	this.state = {
		openned: false,
  	};
  }

  render() {
  	let da = [
		<tr className="kitentry">
		  <td className="kit_open" kititem={this.props.index}><WedgeIndicator openned={this.state.openned} toggler={e=>{this.setState({openned: !this.state.openned})}}/></td>
		  <td>{this.props.name}</td>
		  <td style={{textAlign: 'left'}}>{this.props.osc1.fileName}</td>
		  <td className="startms">{fmtTime(this.props.osc1.zone.startMilliseconds)}</td>
		  <td className="endms">{fmtTime(this.props.osc1.zone.endMilliseconds)}</td>
		  <td><audio controls className="smallplayer" preload="none" style={{backgroundColor: 'blue'}}><source src={'/' + this.props.osc1.fileName} type="audio/wav" /></audio></td>
		</tr>];
	if (this.state.openned) {
		da.push(<WaveView kitProps={this.props} />);
	}
	return da;
  }
};


var KitList = createClass({
  render: function() {
	return (
	<table className='kit_tab'><tbody>
 	<tr className='kithead'>
	<th className='kit_opener xmltab' kititem='-1'>►</th>
	<th>Name</th>
	<th>Path</th>
	<th>Start</th>
	<th>End</th>
	<th>Player</th>
	</tr>
	{this.props.kitList.map((line, ix) =>{
		line.index = ix;
		return <SampleEntry {...line} />
	})}
	</tbody>
	</table>
	);
  }
});


export {KitList};
