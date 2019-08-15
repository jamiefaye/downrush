import React from 'react';
import ReactDOM from "react-dom";
import $ from 'jquery';
import jsonViewer from "./js/jquery.json-viewer.js";

class JsonViewInside extends React.Component {

	componentDidMount() {
		this.symbolize();
	}
	
  symbolize() {
  	if (this.props.json) {
  		$(this.el).jsonViewer(this.props.json, {collapsed: true, rootCollapsable: false});
  	}
  }

	render() {
		this.symbolize();
		return <div ref={(el) => { this.el = el}}> </div>;
	}
}

 class JsonView extends React.Component {
   constructor(props) {
    super(props);
    this.state = {show: false};
  }
 
  render() {
		return (this.state.show ? <pre><JsonViewInside json = {this.props.json} /></pre>
								: <button onClick={e=>{this.setState({show: true})}} >{this.props.label ? this.props.label : "Show"}</button>)
  }
}

export {JsonView};