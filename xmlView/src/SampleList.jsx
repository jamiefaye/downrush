import React from 'react';
import {isArrayLike} from "./JsonXMLUtils.js";

function scanSamples(json, sampMap) {
	for (let k in json) {
		if(json.hasOwnProperty(k)) {
			let v = json[k];
			if (k === 'fileName' && typeof v === "string") {
				sampMap.add(v);
			} else
			if (isArrayLike(v)) {
				for(var ix = 0; ix < v.length; ++ix) {
					let aobj = v[ix];
					if (isArrayLike(aobj) || aobj instanceof Object) {
						scanSamples(v[ix], sampMap);
					}
				}
			} else if(v instanceof Object) {
				scanSamples(v, sampMap);
			}
		}
	}
}

class SampleListEntry extends React.Component {
  render() {
	return <tr><td>{this.props.sample}</td>
	<td><audio controls className='smallplayer' preload='none' ><source src={this.props.samplePath + this.props.sample} type='audio/wav'/></audio></td>
	</tr>;
  }
}

class SampleList extends React.Component {
  constructor(props) {
	super(props);
	this.state = {checked: false};
	this.toggle = this.toggle.bind(this);
  }

  render() {
  let sampleList = this.getSampleList();
  let me = this;
  return (
   <table className='samplelist xmltab'><tbody>
	<tr><th>Samples used in this song</th>
	<th><input className='showdrums' onClick={this.toggle} type='checkbox' defaultChecked={this.state.checked }/>Show /SAMPLES/DRUMS</th>
	</tr>
	{sampleList.map((samp)=>{
		return <SampleListEntry sample={samp} samplePath={me.props.samplePath} key={samp}/>;
	})}
  </tbody></table>);
  }

  toggle() {
	this.setState({checked: !this.state.checked});
  }
  
  getSampleList() {
  	var sampSet = new Set();
	scanSamples(this.props.song, sampSet);
	var sampList = Array.from(sampSet);
	if (!this.state.checked) {
		sampList = sampList.filter(function (n) {
			return !n.startsWith('SAMPLES/DRUMS/');
		});
	}
	sampList.sort();
	return sampList;
  }

}

export {SampleList};
