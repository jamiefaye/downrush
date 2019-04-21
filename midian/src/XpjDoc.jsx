import React from 'react';
import ReactDOM from "react-dom";
import $ from'./js/jquery-3.2.1.min.js';
var pako = require('pako');
import {Xpj} from "./Xpj.js";

class XpjDocView extends React.Component {

	render() {
		return <b>Meow!</b>;
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

				console.log(decStr);
			}

			me.xpj = new Xpj(maxS);
			//me.xpjText = JSON.stringify(me.xpj, undefined, 2);
			me.context.xpjText = maxS;
			me.context.xpj = me.xpj;
			me.context.fname = me.fname;
			me.render();

		};
		fileReader.readAsArrayBuffer(data);
	}





	render() {
		this.xpjDoc = React.createElement(XpjDocView, this.context);
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
