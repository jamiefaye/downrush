import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
import jsonViewer from "./js/jquery.json-viewer.js";

class JsonViewInside extends React.Component {

  symbolize() {
  	if (this.props.json) {
  		$(this.el).jsonViewer(this.props.json, {collapsed: true, rootCollapsable: true});
  	}
  }

	render() {
		this.symbolize();
		return <div ref={(el) => { this.el = el}}> </div>;
	}
}

 class JsonView extends React.Component {
  render() {
		return <pre><JsonViewInside json = {this.props.json} /></pre>;
  }
}

export {JsonView};