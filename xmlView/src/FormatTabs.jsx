import $ from 'jquery';
import React from 'react';
import {formatMidi, genColorTab} from "./SongViewLib.js";

class FormatMidi extends React.Component {

  constructor() {
	super();
	this.state = {};
  }

  componentDidMount() {
  	formatMidi($(this.el), this.props.midi);
  }

  render() {
	return <div  ref={el => this.el = el}> </div>
  }
};

class PreviewGrid extends React.Component {
// 	let ctab = genColorTab(jsong.preview);
// 	obj.append(ctab);
  componentDidMount() {
  	let ptab = genColorTab(this.props.preview);
  	$(this.el).append(ptab);
  }

  render() {
	return <div  ref={el => this.el = el}> </div>
  }
};

export {FormatMidi, PreviewGrid};
