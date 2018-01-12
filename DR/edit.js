"use strict";
//-------------定数初期化-----------------
var code_edit = document.getElementById ("code_edit");

var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;
var eva_output = document.getElementById( "eva" )//.innerHTML;

var ckh = document.getElementById ("chk");

var fname = "";

//----- Enrich editor -----
CodeMirror.modeURL = "codemirror-5.30.0/mode/%N/%N.js"; // For automatic mode call
var jsEditor = CodeMirror.fromTextArea(code_edit, {
    mode: "xml",
    lineNumbers: true,
    indentUnit: 4,
    autoCloseBrackets: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {"Ctrl-Space": "autocomplete"}
});

jsEditor.setSize("100%","100%");

CodeMirror.commands.autocomplete = function(cm) {
    cm.showHint({hint: CodeMirror.hint.anyword});
}

function modeChanger(filename)
{
	// Extension discrimination
	var splitname = filename.split(".");
	var len = splitname.length;
	if (len !== 0) {
		var ext = splitname[len - 1].toLowerCase();
/*		if(ext == "lua"){
			jsEditor.setOption("mode", "lua");
		}else if(ext == "js"){
			jsEditor.setOption("mode", "javascript");
		}else if(ext == "htm" || ext == "html"){
			jsEditor.setOption("mode", "htmlmixed");
		}else if(ext == "css"){
			jsEditor.setOption("mode", "css");
		}else{
			jsEditor.setOption("mode", "lua");		
		}
*/
		var info = CodeMirror.findModeByExtension(ext);
		if (info) {
			var mode = info.mode;
			var spec = info.mime;
			jsEditor.setOption("mode", spec);
			CodeMirror.autoLoadMode(jsEditor, mode);
			document.getElementById("extmode").textContent = mode + " mode";
			return;
 		 }
	}
	//fall back
	jsEditor.setOption("mode", "text/plain");
	CodeMirror.autoLoadMode(jsEditor, "null");
	document.getElementById("extmode").textContent = "Unknown (text/plain)";
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
	}

	postWorker("eva");
	modeChanger(filename_input.value);
	postWorker("load");
	fname = filename_input.value;

	jsEditor.markClean();

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

	if(e.keyCode == 116) //F5
	{
		btn_run();
		return false;		
	}
	if(e.keyCode == 117) //F6
	{
		btn_debug();
		return false;		
	}
	if(e.keyCode == 118) //F7
	{
		btn_unlock();
		return false;		
	}
	if(e.keyCode == 119) //F8
	{
		btn_break();
		return false;		
	}
	if(e.keyCode == 120) //F9
	{
		btn_getmsg();
		return false;		
	}
};



//---------Button-----------

//CONFIGボタン
function btn_config()
{
//	if(window.confirm('Load /SD_WLAN/CONFIG?'))
//	{
		filename_input.value="/SD_WLAN/CONFIG";
		modeChanger(filename_input.value);
		postWorker("load");
//	}
}

//Loadボタン
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		modeChanger(filename_input.value);
		postWorker("load");
		fname = filename_input.value;
//	}
	jsEditor.markClean();
}

//Saveボタン
function btn_save(){
	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("save");
	jsEditor.markClean();
}

//Runボタン
function btn_run(){
	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("run");
	jsEditor.markClean();
}

//Debugボタン
function btn_debug(){
	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("debug");
	jsEditor.markClean();
}

//Unlockボタン
function btn_unlock(){
	postWorker("unlock");
}

//Breakボタン
function btn_break(){
	addStat("*Break: Only works on debug mode or breakpoint.");
	addStat("Break...");	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/command.cgi?op=131&ADDR=0x00&LEN=0x01&DATA=!");
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout=3000;
	xhr.onload = function(){
		if (xhr.status == 200) {
			addStat(xhr.responseText);
		}else {
			addStat(xhr.statusText);
		}
	};
	xhr.onerror = function(){addStat(xhr.statusText);};
	xhr.send();
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
	location.href="/FlashTools.lua";
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

// Set Eva
function setEva(text)
{
//	eva_output.innerHTML = "<pre>"+text + "</pre>";
}

//editorにセットする
function setEditor(text)
{
	jsEditor.doc.setValue(text);
}

//editorのハイライトを消去する
function clrLineHighlight()
{
	var h = jsEditor.eachLine(function(h){ //全ラインに対して処理
		jsEditor.removeLineClass(h, "background", "error-line");
	});
}

//editorのハイライトを設定する
function setLineHighlight(lineno)
{// and removeLineClass, 
	var h = jsEditor.getLineHandle(lineno - 1);
	jsEditor.addLineClass(h, "background", "error-line");
}

//Workerに投げる
function postWorker(mode)
{
	jsEditor.save();
	var code_body = code_edit.value;
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
	worker = new Worker("worker.js");
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
		setEditor(e.data.arg);
	}
	if(e.data.func == "setEva")
	{
		setEva(e.data.arg);
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

