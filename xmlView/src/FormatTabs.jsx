import $ from 'jquery';
import React from 'react';
import {formatMidi} from "./SongViewLib.js";

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

export {FormatMidi};
