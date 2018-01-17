"use strict";
//-------------定数初期化-----------------
var code_edit = document.getElementById ("code_edit");

var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;

var ckh = document.getElementById ("chk");

var fname = "";


	
/**
* Converts passed XML string into a DOM element.
* @param 		{String}			xmlStr
* @return		{Object}			XML DOM object
* @exception	{GeneralException}	Throws exception if no XML parser is available.
* @TODO Should use this instead of loading XML into DOM via $.ajax()
 */
function getXmlDOMFromString(xmlStr) {
	if (window.ActiveXObject && window.GetObject) {
		var dom = new ActiveXObject('Microsoft.XMLDOM');
		dom.loadXML(xmlStr);
		return dom;
	}
	if (window.DOMParser){
		return new DOMParser().parseFromString(xmlStr,'text/xml');
	}
	throw new Error( 'No XML parser available' );
}

// Changes XML Dom elements to JSON
// Modified to ignore text elements
// Modified version from here: http://davidwalsh.name/convert-xml-json
function xmlToJson(xml) {
  // Create the return object
  let obj = {};

  if (xml.nodeType === 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j += 1) {
        const attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  // If just one text node inside
  if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
    obj = xml.childNodes[0].nodeValue;
  } else if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i += 1) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (item.nodeType === 3) continue; // JFF don't bother with text nodes
      if (typeof (obj[nodeName]) === 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof (obj[nodeName].push) === 'undefined') {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

function sizeLimitScalar(v)
{
	if(v.constructor !== String) return v;
	if(v.length < 64) return v;
	return v.substr(0, 64) + '…';
}

function jsonToTable(json, obj, formatters) {
	for (var k in json) {
		if(json.hasOwnProperty(k)) {
			let tr = $('<tr/>');
			if(formatters && formatters[k]) {
				let ourTD = $("<td class='tabval' colspan='2'/>");
				formatters[k](json, k, ourTD);
				tr.append(ourTD);
				obj.append(tr);
				continue;
			}

			let v = json[k];
			if (v.constructor === Array) {
				let intTab = $('<table/>'); // subtable for array elements
				intTab.append($("<th class='arhead' colspan='3'/>").html(k + ':'));
				for(var ix = 0; ix < v.length; ++ix) {
					let tra = $('<tr/>');
					tra.append($("<td class='arindex'/>").html(ix)); // show array index
					let aobj = v[ix];
					if (aobj.constructor == Array || aobj.constructor == Object) {
						let deepTab = $('<table/>'); 
						let deeper = jsonToTable(aobj, deepTab, formatters);
						tra.append($("<td class='arsubtab'/>").html(deeper));
					} else {
						tra.append($("<td class='arscal'/>").html(sizeLimitScalar(aobj)));
					}
					intTab.append(tra);
				}
				tr.append(intTab);
			} else if(v.constructor === Object) {
				tr.append($("<td class='keyval'/>").html(k + ':'));
				let intTab = $('<table/>');
				let inside = jsonToTable(v, intTab, formatters);
				tr.append($("<td class='tabval' colspan='2'/>").html(inside));
				
			} else {
				tr.append($("<td class='keyval'/>").html(k + ':'));
				tr.append($("<td class='tabval'/>").html(sizeLimitScalar(v)));
				//tr.append($('<td/>'));
			}
			obj.append(tr);
		}	
	}
	return obj;
}

var noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

var gamma = 1.0 / 5.0;
var gammaTab;

function gamma_correct(hexChars) {
	if(!gammaTab) {
		gammaTab = [];
		for(var i = 0; i < 256; ++i) {
			// gammaTab[i] = 255.0 * ((i / 255.0) ** (1. gamma));
			
			gammaTab[i] = Math.round( ((i / 255.0) ** gamma * 255.0 ) );
		}
	}
	let pix = parseInt(hexChars, 16);
	let r = pix >> 16;
	let g = pix >> 8 & 0xFF;
	let b = pix & 0xFF;
	let fixedPix = (gammaTab[r] << 16) + (gammaTab[g] << 8) + gammaTab[b];
	let asHex = (fixedPix + 0x1000000).toString(16).slice(-6); // Thanks Fabio Ferrari!
	return asHex;
}
function genColorTab(colors)
{
	let colTab = $('<table/>');
	for(var y = 0; y < 8; ++y) {
		let colRow = $('<tr/>');
		for(var x = 0; x <18; ++x) {
			let td = $("<td class='coltab'/>");
			let off = (7 - y) * 108 + x * 6;
			let hex = colors.substr(off, 6);
			// if (hex !== '000000') console.log("(" + x + ", " + y + " = 0x" + hex);
			td.css("background-color", '#' + gamma_correct(hex));
			colRow.append(td);
		}
		colTab.append(colRow);
	}
	return colTab;
}

function forceArray(obj) {
	if(obj !== undefined && obj.constructor === Array) return obj;
	let aObj = [];
	if(obj === undefined) return aObj;
	aObj[0] = obj;
	return aObj;
}

// Used to cope with y addresses of -32768
function rowYfilter(row) {
	let y = Number(row.y);
	if (y === -32768) {
		if (row.drumIndex) {
			y = row.drumIndex;
		}
	}

	return y;
}

// Convert Midi note number into note name + octave, with 0 meaning C minus 2
function yToNoteName(note)
{
	let oct = Math.round(note / 12) - 2;
	let tone = note % 12;
	return noteNames[tone] + oct;
}

function plotTrack(track, obj) {
// first walk the track and find min and max y positions
	let ymin =  1000000;
	let ymax = -1000000;
	let rowList = forceArray(track.noteRows.noteRow);
	let parentDiv = $("<div class='trgrid'/>");
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		let y = rowYfilter(row);
		if (y >= 0) {
			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
	}
	let lowNote = yToNoteName(ymin);
	let hiNote = yToNoteName(ymax);
	let totH = ((ymax - ymin) + 1) * 4;
	obj.append(hiNote);
	parentDiv.css({height: totH + 'px'});
	for (var rx = 0; rx < rowList.length; ++rx) {
		let row = rowList[rx];
		var noteList = forceArray(row.notes.note);
		let y = rowYfilter(row);
		if (y < 0) continue;
		for (var nx = 0; nx < noteList.length; ++nx) {
			let n = noteList[nx];
			let x = n.pos;
			let dur = n.length;
			if (dur > 1) dur--;
			let vel = n.velocity;
			let ndiv = $("<div class='trnote'/>");
			let ypos = (y- ymin) * 4 + 2;
			ndiv.css({left: x + 'px', bottom: ypos + 'px', width: dur + 'px'});
			parentDiv.append(ndiv);
		}
	}
	obj.append(parentDiv);
	obj.append(lowNote);
}

function trackHeader(track,obj) {
	let section = track.section;
	let ttype = 'Synth';
	if (track.midiChannel) {
		ttype = 'Midi';
	}
	if (track.kit) {
		ttype = 'Kit';
	}
	let len = track.trackLength;
	let patch = Number(track.instrumentPresetSlot);
	let colourOffset = track.colourOffset;
	//let subpatch = Number(track.instrumentPresetSubSlot);
	var patchName;
	if (ttype === 'Kit') {
		patchName = kitNames[patch];
	} else if (ttype === 'Midi') {
		patch = Number(track.midiChannel) + 1;
		patchName = '';
		
	} else {
		patchName = patchNames[patch];
	}
//	if(subpatch >= 0) {
//		patch = patch + String.fromCharCode(97 + subpatch);
//	}
	let trtab = $('<table/>');
	trtab.append($("<tr><th>Section</th><th>Type</th><th>Preset #</th><th>Name</th><th>Length</th><th>color</th></tr>"));
	let tr = $("<tr/>");
	tr.append($("<td/>").html(section));
	tr.append($("<td/>").html(ttype));
	tr.append($("<td/>").html(patch));
	tr.append($("<td/>").html(patchName));
	tr.append($("<td/>").html(len));
	tr.append($("<td/>").html(colourOffset));
	trtab.append(tr);
	obj.append(trtab);

}

function horizontalArray(arr, obj, title) {
	let trtab = $('<table/>');
	if(title) {
		let trt = $("<tr/>");
		trt.append($("<th colspan='" + arr.length +"'/>").html(title));
		trtab.append(trt);
	}
	let trh = $("<tr/>");
	for(var i = 0; i < arr.length; ++i) {
		trh.append($("<th/>").html(i));
	}
	trtab.append(trh);
	
	let trd = $("<tr/>");
	for(var i = 0; i < arr.length; ++i) {
		let rc = "" + arr[i];
		trd.append($("<td/>").html(rc));
	}
	trtab.append(trd);
	
	obj.append(trtab);
}

function sectionRepeats(arr, obj) {
	let repL = [];
	for(var i = 0; i < arr.length; ++i) {
		repL[i] = arr[i].numRepeats;
	}
	horizontalArray(repL, obj, "Section Repeats");
}

function songHead(jsong, obj) {
	let songS = Object.assign({}, jsong);

	delete songS.tracks;
	delete songS.preview;
	delete songS.previewNumPads;
	delete songS.timerTickFraction;
	delete songS.timerTickFraction;
	
	let formaters = {
		"modeNotes": function(source, keyV, wobj) {
			horizontalArray(source.modeNotes.modeNote, wobj, "Mode Notes");
		},
		"sections": function(source, keyV, wobj) {
			sectionRepeats(source.sections.section, wobj);
		},
	};
	jsonToTable(songS, obj, formaters);
}

// Return song tempo calculated from timePerTimerTick and timerTickFraction
function convertTempo(jsong)
{
	let fractPart = (jsong.timerTickFraction>>>0) / 0x100000000;
	let realTPT = Number(jsong.timePerTimerTick) + fractPart;
	
	let tempo = Math.round(120.0 * realTPT / 459.375);
	return tempo;
}

function formatSong(jsong, obj) {
	let ctab = genColorTab(jsong.preview);
	obj.append(ctab);
	obj.append("Tempo = " + convertTempo(jsong) + " bpm");

	if(jsong.tracks) {
	  let trax = forceArray(jsong.tracks.track);
	  if (trax) {
		for(var i = 0; i < trax.length; ++i) {
			obj.append($("<h3/>").text("Track number " + (i + 1)));
			trackHeader(trax[trax.length - i- 1], obj);
			plotTrack(trax[i], obj);
		}
	  }
	}
	songHead(jsong, obj);

}

function jsonToTopTable(json, obj)
{
	$('#fileTitle').html("<h3>" + fname + "</h3>");
	if(json['song']) {
		formatSong(json.song, obj);
	} else {
		jsonToTable(json, obj);
	}
}

// Returns short cut pathways for populating the value display table
var shortCutTab = Array(8);
for(var i = 0; i < shortCutTab.length; ++i) shortCutTab[i] = Array(16);

function genValueArray(json)
{
	
}

function modeChanger(filename)
{
	// Extension discrimination
	var splitname = filename.split(".");
	var len = splitname.length;
}

//------ Tool button management--------
var showToolFlag=false;
function showTool()
{
		if(showToolFlag)
		{
			document.getElementById("ToolButtons1").style.display="none";
			showToolFlag=false;
		}else{
			document.getElementById("ToolButtons1").style.display="block";
			showToolFlag=true;
		}
}

// Page transition warning

var unexpected_close = true;
/*
window.onbeforeunload = function(event){
	if(unexpected_close && !jsEditor.isClean())
	{
		event = event || window.event;
		event.returnValue = "Exit?";
	}
}
*/

//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		filename_input.value = decodeURI(urlarg);
		//$('#fileTitle').text(decodeURI(urlarg));
	}

//	postWorker("eva");
//	modeChanger(filename_input.value);
	postWorker("load");
	fname = filename_input.value;
	// jsEditor.markClean();
}
window.onload = onLoad;

//-------keyin--------
document.onkeydown = function (e){
	if(!e) e = window.event;

	if(e.keyCode == 112) //F1
	{
		btn_save();
		return false;		
	}

	if(e.keyCode == 123) //F12
	{
		btn_load();
		return false;		
	}
	if(e.keyCode == 118) //F7
	{
		btn_unlock();
		return false;		
	}

	if(e.keyCode == 120) //F9
	{
		btn_getmsg();
		return false;		
	}
};



//---------Button-----------

//CONFIG
function btn_config()
{
//	if(window.confirm('Load /SD_WLAN/CONFIG?'))
//	{
		filename_input.value="/SD_WLAN/CONFIG";
		modeChanger(filename_input.value);
		postWorker("load");
//	}
}

//Load
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		modeChanger(filename_input.value);
		postWorker("load");
		fname = filename_input.value;
//	}
	// jsEditor.markClean();
}

//Save

function btn_save(){
/*
	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("save");
	// jsEditor.markClean();
*/
}

// Unlock
function btn_unlock(){
	postWorker("unlock");
}

//GetMsgボタン
function btn_getmsg()
{
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/command.cgi?op=130&ADDR=0x01&LEN=0xFE");
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout=3000;
	xhr.onload = function(){
		if (xhr.status == 200) {
			addStat("*GetMsg: "+xhr.responseText);
		}else {
			addStat("*GetMsg: "+xhr.statusText);
		}
	};
	xhr.onerror = function(){addStat("*GetMsg: "+xhr.statusText);};
	xhr.send();
}

//Menuボタン
function btn_menu()
{

	unexpected_close=false; //ページ脱出警告を無効化
	location.href="/Downrush.lua";
}

//---------handler-----------

var status_str="";
//statusをクリアする
function clrStat()
{
	status_str="";
	stat_output.value = status_str;
}
// add one line to status
function addStat(x)
{
	status_str += x+"\n";
	stat_output.value = status_str;
	stat_output.scrollTop = stat_output.scrollHeight;
}

// Clear Response
function clrRes()
{
	respons_output.innerHTML = "Response";
}

// Set response
function setRes(text)
{
	if(chk.checked)
	{
		respons_output.innerHTML = "<pre>"+text + "</pre>";
	}else{
		respons_output.innerHTML = text ;
	}
}

//editor
function setEditText(text)
{
//	$("#textPlace").text(text);
	// jsEditor.doc.setValue(text);
	var fixedText = text.replace(/<firmwareVersion>1.3.\d<.firmwareVersion>/i,"");
	var asDOM = getXmlDOMFromString(fixedText);
	var asJSON = xmlToJson(asDOM);

	let h = jsonToTopTable(asJSON, $('#jtab'));
	//$('#jtab').append(h);
	// buildHtmlTable([asJSON]);
/*
  	xmlEditor.loadXmlFromString(fixedText, "#xml", function(){
  	    $("#xml").show();
		xmlEditor.renderTree();
	});
*/

}

//editorのハイライトを消去する
function clrLineHighlight()
{
	/*
	var h = jsEditor.eachLine(function(h){ //全ラインに対して処理
		jsEditor.removeLineClass(h, "background", "error-line");
	});
	*/
}

//editorのハイライトを設定する
function setLineHighlight(lineno)
{// and removeLineClass, 
//	var h = jsEditor.getLineHandle(lineno - 1);
//	jsEditor.addLineClass(h, "background", "error-line");
}

//Workerに投げる
function postWorker(mode)
{
	// jsEditor.save();
	
	var code_body = "";
	if(mode === 'save') { code_body = xmlEditor.getXmlAsString(); }
	//CRLFをLFにしてから、CRLFにする。(LFもCRLFになる)
	var code_body_lf = code_body.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");

	var msg = {
		filepath: filename_input.value,
		arg: "", // arg_input.value,
		mode: mode,
		edit: code_body_lf
	};
	worker.postMessage(msg);
}

//------------Worker---------------
if (!window.Worker) {
	alert("Web Worker disabled! Editor won't work!")
}

var worker;
try {
	worker = new Worker("XMLworker.js");
}catch (e) {
	addStat("Exception!(UI): "+e.message);
}
worker.onmessage = function(e) {
	//RPC的実装

	//debug用
	if(e.data.func == "console.log")
	{
		console.log(e.data.arg);
	}
	if(e.data.func == "clearStatus")
	{
		clrStat();
	}
	if(e.data.func == "addStatus")
	{
		addStat(e.data.arg);
	}
	if(e.data.func == "clearResponse")
	{
		clrRes();
	}
	if(e.data.func == "setResponse")
	{
		setRes(e.data.arg);
	}
	if(e.data.func == "setEditor")
	{
		setEditText(e.data.arg);
	}
	if(e.data.func == "clrLineHighlight")
	{
		clrLineHighlight();
	}
	if(e.data.func == "setLineHighlight")
	{
		setLineHighlight(e.data.arg);
	}
};

