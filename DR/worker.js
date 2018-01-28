"use strict";

var xhr_timeout = 5*60*1000;
//---------------セレクタ--------------------

/*

The front end and the RPC part are created.
After that, make a communication part of each function.
*/

onmessage = function(e) {
if(e.data.mode == "unlock")
	{
//		callFunction("console.log","unlock");
		callFunction("clearStatus","");
		unlock(e.data);
		
	}else if(e.data.mode == "save")
	{
//		callFunction("console.log","save");
		callFunction("clearStatus","");
		save(e.data);
		
	}else if(e.data.mode == "load")
	{
//		callFunction("console.log","load");
		callFunction("clearStatus","");
		load(e.data);
	}else{
		callFunction("console.log","unknown");
	}
};

//-----------------------------------

function load(msg)
{
	var filepath = msg.filepath;
	filepath = filepath.replace(/ /g , "|" ) ;
	callFunction("addStatus","Load Request:"+filepath);

	var xhr = new XMLHttpRequest();
	xhr.open("GET" , filepath, false);//同期Request
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout = xhr_timeout;
	try {
		xhr.send();
	}catch (e) {
		callFunction("addStatus","Exception!(Worker): "+e.message);
	}
	
	//---return stat---
	if(xhr.readyState != 4)
	{
		callFunction("addStatus","load failed.");
		return -1;
	}
	if(xhr.status == 0){
		callFunction("addStatus","internal Error (EMPTY RESPONSE / CONNECTION REFUSED / etc...)");
		return -1;
	}

	callFunction("setEditor",xhr.responseText);

	if((xhr.status < 200) || (xhr.status > 300)){ //!=2XX
		callFunction("addStatus","Server Error. CODE:"+xhr.status);
		return -1;
	}
	callFunction("addStatus","load success.("+xhr.status+")");
	return 0;
}

function save(msg)
{
	var filepath = msg.filepath;
//	var arg = msg.arg;
	var edit = msg.edit;

	callFunction("addStatus","upload Start : "+filepath);

//	callFunction("console.log",filepath);
//	callFunction("console.log",arg);
//	callFunction("console.log",edit);

	var xhr = new XMLHttpRequest();
	xhr.open("PUT", filepath, false);//同期Request
	xhr.setRequestHeader("Overwrite", "t");
	xhr.setRequestHeader("Content-type", "text/plain");
	xhr.timeout = xhr_timeout;
	
	try {
		xhr.send(edit);
	}catch (e) {
		callFunction("addStatus","Exception!(Worker): "+e.message);
	}

	//---return stat---
	if(xhr.readyState != 4)
	{
		callFunction("addStatus","save failed.");
		return -1;
	}
	if(xhr.status == 0){
		callFunction("addStatus","internal Error (EMPTY RESPONSE / CONNECTION REFUSED / etc...)");
		return -1;
	}
	if((xhr.status < 200) || (xhr.status > 300)){ //!=2XX
		callFunction("addStatus","Server Error. CODE:"+xhr.status);
		return -1;
	}
	callFunction("addStatus","save success.("+xhr.status+")");
	return 0;
}

function run(msg)
{
	var filepath = msg.filepath;
	var arg = msg.arg;
//	var edit = msg.edit;

	var xhr = new XMLHttpRequest();
	if(arg == ""){
		xhr.open("GET" , ""+filepath,false);//同期Request
		callFunction("addStatus","run Start :"+filepath);
	}else{
		xhr.open("GET" , ""+filepath+"?"+encodeURIComponent(arg),false);//同期Request
		callFunction("addStatus","run Start :"+filepath+"?"+encodeURIComponent(arg));
	}
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout = xhr_timeout;
	
	var startTime = new Date();	
	try {
		xhr.send();
	}catch (e) {
		callFunction("addStatus","Exception!(Worker): "+e.message);
	}
	var endTime = new Date();
	callFunction("addStatus","*Elapsed time: "+(endTime - startTime + "ms"));
	
	//---return stat---
	if(xhr.readyState != 4)
	{
		callFunction("addStatus","run failed.");
		return -1;
	}
	callFunction("setResponse",xhr.responseText);

	if(xhr.status == 0){
		callFunction("addStatus","internal Error (EMPTY RESPONSE / CONNECTION REFUSED / etc...)");
		return -1;
	}
	if((xhr.status < 200) || (xhr.status > 300)){ //!=2XX
		callFunction("addStatus","Server Error. CODE:"+xhr.status);
		return -1;
	}
	callFunction("addStatus","run success.("+xhr.status+")");
	return 0;
}


function unlock(msg)
{
	callFunction("addStatus","Unlock...");
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET" , "/upload.cgi?WRITEPROTECT=OFF",false);//同期Request
	xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jan 1970 00:00:00 GMT");
	xhr.timeout = xhr_timeout;
	try {
		xhr.send();
	}catch (e) {
		callFunction("addStatus","Exception!(Worker): "+e.message);
	}
	
	//---return stat---
	if(xhr.readyState != 4)
	{
		callFunction("addStatus","unlock failed.");
		return -1;
	}
	callFunction("setResponse",xhr.responseText);

	if(xhr.status == 0){
		callFunction("addStatus","internal Error (EMPTY RESPONSE / CONNECTION REFUSED / etc...)");
		return -1;
	}

	callFunction("addStatus","unlock "+(xhr.responseText)+".("+xhr.status+")");
	if((xhr.status < 200) || (xhr.status > 300)){ //!=2XX
		callFunction("addStatus","Server Error. CODE:"+xhr.status);
		return -1;
	}
	return 0;
}

/*
	console.log
	clearStatus
	addStatus
	clearResponse
	setResponse
	setEditor
	setEva
	
		var msg = {
		filepath: filename_input.value,
		arg: arg_input.value,
		mode: mode,
		edit: code_body_lf
	};
*/
function callFunction(func,arg)
{
	var msg = {
		func: func,
		arg: arg
	}
	postMessage(msg);
}