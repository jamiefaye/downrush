import React from 'react';
import ReactDOM from "react-dom";
var pako = require('pako');
import {Xpj} from "./Xpj.js";
import {JsonView} from "./JsonView.jsx";
import {gamma_correct} from "../../xmlView/src/SongUtils.js";


class XplTrackCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }
  componentDidMount() {
    // Draws a square in the middle of the canvas rotated
  	let props = this.props;

    let clip = props.clip;
    let trans = props.transform;
    let scale = trans.scale;
    let noteH = trans.noteHeight;
    let maxN = clip.maxN;
    let w = props.width;
    let h = props.height;
    
    let nameTab = trans.xpj.nameToTrack;
    let color = nameTab[clip.key].colour;


    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#' + gamma_correct(color.toString(16));

    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000000';

    for (let i = 0; i < clip.events.length; ++i) {
    	let n = clip.events[i];
    	if (!n.note) continue;
    	let tS = n.time;
    	let tE = n.note.length;
    	let x = tS * scale;
    	let w = n.note.length * scale;
    	if (w > 2) w--;
    	let y = (maxN - n.note.note) * noteH;
    	ctx.fillRect(x, y, w, noteH);
    
    }
    ctx.restore();
  }
  render() {
    return <canvas width={this.props.width} height={this.props.height} ref={this.canvasRef} />;
  }
}

class XpjClipView extends React.Component {

  render() {
  	let props = this.props;
    let clip = props.clip;
    let trans = props.transform;
    let scale = trans.scale;
    let noteH = trans.noteHeight;
    let w = clip.maxT *scale;
    let h =(clip.maxN - clip.minN) * noteH + 2;
  	return <XplTrackCanvas clip={clip} transform={trans} width={w} height={h} clipN={this.props.clipN}/>;
  }

}


class XpjView extends React.Component {
  constructor(props) {
	super(props);
	this.transform = {scale: 1/60, noteHeight: 4};
	this.ingest();
  }

  ingest() {
  	this.xpj = this.props.xpj;
	this.tracks = this.xpj.tracks;
	this.sequence = this.xpj.sequence;
	this.clipMaps = this.xpj.clips;
	this.transform.tracks = this.tracks;
	this.transform.xpj = this.xpj;
  }

  createTable() {
    let xpj = this.xpj;
    let nameTab = this.xpj.nameToTrack;

	let table = [];
	for (let r = xpj.minRow; r <= xpj.maxRow; ++r) {
		let rowA = xpj.matrix[r];
		let children = [];
		for (let c = xpj.minCol; c <= xpj.maxCol; ++c) {
			let clip = rowA[c];
			let color = this.tracks[c].colour;
			let colorCode ='#' + gamma_correct(color.toString(16));
			let colorStyle = {backgroundColor: colorCode};
			if (!clip) {
				children.push(<td className='xpjmt'> </td>);
			} else {
				
				children.push(<td className='xpjtd' style={colorStyle}><XpjClipView clip={clip} transform={this.transform}/></td>);
			}
		}
		table.push(<tr>{children}</tr>);
	}
	return table;
  }

  render() {
 
  		let xpj = this.xpj;
  		if (!xpj) return null;
		if (xpj.minRow === Number.MAX_SAFE_INTEGER || xpj.minCol === Number.MAX_SAFE_INTEGER) return null;

		return <React.Fragment>
		<table><tbody>
			{this.createTable()}
		</tbody></table>
		<JsonView label='xpj Json' json = {this.props.xpj} />
		</React.Fragment>


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
	// xpjDoc.render();
	return xpjDoc;
}

export {openXpjDoc};
