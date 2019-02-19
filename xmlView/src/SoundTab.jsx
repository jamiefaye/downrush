import $ from 'jquery';
import React from 'react';
import {formatSound} from "./SongViewLib.js";

class SoundTab extends React.Component {

  constructor() {
	super();
	this.state = {};
  }

  componentDidMount() {
  	formatSound($(this.el), this.props.sound, this.props.sound.defaultParams);
  }

  render() {
	return <div  ref={el => this.el = el}> </div>
  }
};

export {SoundTab};
