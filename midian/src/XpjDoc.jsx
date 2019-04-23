import React from 'react';
import ReactDOM from "react-dom";
var pako = require('pako');
import {Xpj} from "./Xpj.js";
import {JsonView} from "./JsonView.jsx";




class XplTrackCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }
  componentDidUpdate() {
    // Draws a square in the middle of the canvas rotated
    // around the centre by this.props.angle
    const { angle } = this.props;
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = '#4397AC';
    ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
    ctx.restore();
  }
  render() {
    return <canvas width="300" height="300" ref={this.canvasRef} />;
  }
}





class XpjView extends React.Component {
  render() {
		return <div>
			<XplTrackCanvas angle={33}/><br/>
			<JsonView label='xpj Json' json = {this.props.xpj} />
			</div>
  }
}

class XpjDoc {
   constructor(context) {
	this.context = context;
	this.jqElem = context.jqElem;
	this.fname = context.fname;
  }

	openOnBuffer(data) {
		var xpjABuffer;
		let me = this;
		var fileReader = new FileReader();
		fileReader.onload = function(event) {
			xpjABuffer = event.target.result;
			var nextChunk = new Uint8Array(xpjABuffer);	
			var lastLen = 0;
			var chunkList = [];
			while (nextChunk.length > 12) {
				var inflator = new pako.Inflate();
				inflator.push(nextChunk, true);
				if (inflator.err) {
 					console.log(inflator.msg);
 					break;
				}
				chunkList.push(inflator.result);
				let strm = inflator.strm;
				let lastLen = strm.total_in;
				nextChunk = nextChunk.subarray(lastLen);
			}
			var decoder = new TextDecoder('utf8');
			var maxL = 0;
			var maxS;

			let stringA = [];
			for (let i = 0; i < chunkList.length; ++i) {
				let ch = chunkList[i];
				let cl = ch.length;

				var decStr = decoder.decode(ch);
				stringA.push(decStr);

				if (cl > maxL) {
					maxL = cl;
					maxS = decStr;
				}

				// console.log(decStr);
			}

			me.xpj = new Xpj(maxS);
			//me.xpjText = JSON.stringify(me.xpj, undefined, 2);
			//me.context.xpjText = maxS;
			me.context.xpj = me.xpj;
			me.context.fname = me.fname;
			me.render();

		};
		fileReader.readAsArrayBuffer(data);
	}

	render() {
		this.xpjDoc = React.createElement(XpjView, this.context);
		ReactDOM.render(this.xpjDoc, this.jqElem);
	}

}


function openXpjDoc(where, fname) {
	let context = {};
	context.jqElem =  where;
	context.fname = fname;
	let xpjDoc = new XpjDoc(context);
	xpjDoc.render();
	return xpjDoc;
}

export {openXpjDoc};
