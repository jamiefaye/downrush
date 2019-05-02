
import React from 'react';
import ReactDOM from "react-dom";
import Clipboard from "./js/clipboard.min.js";

function WedgeIndicator(props) {
	return (<span className='wedge' onClick={props.toggler}>
	{props.opened ? '▼' : '►'}
	</span>);
}

class IconPushButton extends React.Component {
  constructor(props) {
	super(props);
		this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
		this.buttonEl.blur();
		this.props.onPush(e);
  }

  render() {
	return (
		<button className='butn' title={this.props.title} ref={(el) => { this.buttonEl = el}}>
			<img width='16px' height='18px' className='playbutimg' src={this.props.src} onClick={this.handleClick} />
		</button>);
	}
};

class Icon2PushButton extends React.Component {
  constructor(props) {
	super(props);
	this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
		this.buttonEl.blur();
		this.props.onPush(e);
  }

  render() {
	return (
		<button className='butn' title={this.props.title} ref={(el) => { this.buttonEl = el}}>
			<img width='16px' height='18px' className='playbutimg' src={this.props.pushed ? this.props.srcD : this.props.srcU}
			 onClick={this.handleClick} />
		</button>);
	}
};


class PushButton extends React.Component {
  constructor(props) {
	super(props);
		this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
	//	this.buttonEl.blur();
		this.props.onPush(e);
  }

  render() {
	return (
		<button className={this.props.class} title={this.props.title} ref={(el) => { this.buttonEl = el}}>
			<div onClick={this.handleClick} >{this.props.title}</div>
		</button>);
	}
};


class CopyToClipButton extends React.Component {
  componentDidMount() {
	let me = this;
	new Clipboard(this.buttonEl, {
	   text: function(trigger) {
		let text = me.props.getText();
		return text;
	}
	});
  }

  render() {
	return (
		<button className='butns' title={this.props.title} ref={(el) => { this.buttonEl = el}}>
			<div>{this.props.title}</div>
		</button>);
	}
};

const pasteStyle = {verticalAlign: 'middle'};

class PasteTarget extends React.Component {

	render() {
		return (<label style={pasteStyle}>{this.props.label}<textarea style={pasteStyle} ref={(el) => { this.textaref = el}} onPaste={(e)=>{this.handlePaste(e)}} className='paster' rows='1'/></label>);
	}

	handlePaste(e) {
		let clipboardData = e.clipboardData || e.originalEvent.clipboardData || window.clipboardData;

		let pastedData = clipboardData.getData('text');

		let me = this;
		setTimeout( function() {
			me.textaref.value = me.textaref.defaultValue;
		}, 200);
		this.props.paste(pastedData);
	}
};

export {WedgeIndicator, IconPushButton, Icon2PushButton, PushButton, CopyToClipButton, PasteTarget};
