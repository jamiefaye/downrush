import $ from'./js/jquery-3.2.1.min.js';
import {stepNextFile} from "./StepNextFile.js";
import {openFileBrowser, saveFileBrowser, fileBrowserActive} from './FileBrowser.js';
import FileSaver from 'file-saver';

var local_exec = document.URL.indexOf('file:') == 0;

class FileManager {

  constructor(propsIn) {
	let props = propsIn;
	this.props = props;
	this.prefix = props.prefix;
	this.defaultName = props.defaultName;
	this.defaultDir = props.defaultDir;
	this.loadCallback = props.load;
	this.saveCallback = props.save;
	this.newCallback = props.new;
	this.fname = props.defaultName;
	this.homeDoc = props.homeDoc;
	this.dataType = props.dataType;
	this.fileExtensions = props.fileExtensions;
	this.extractText = props.extractText;

	this.content_type = props.content_type ? props.content_type : 'text/plain';
	this.setupGUI();
  }

/*
 let props = {
	prefix:  "meow",
	defaultName: "SONG",
	defaultDor: "/SONGS",
	loadCallback:  f(data, fileName, thismanager, homedoc) //
	saveCallback:  f(thismanager, homeDoc) //
	newCallback: f(thismanager, homeDoc).
	fileExtensions: [],
	content_type: 
 };

*/
  prefixId(item) {
	return $("#" + this.prefix + item);
  }

  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	this.prefixId("status").text("Loading: " +  this.fname);
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		me.loadCallback(data, fname, me, me.homeDoc);
		me.prefixId("status").text(me.fname + " loaded.");
	},

	error: function (data, textStatus, jqXHR) {
		console.log("Error: " + textStatus);
		me.prefixId("status").text(textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType= me.dataType;
		return xhr;
	},

	});
}

  initialLoad(fname) {
		this.loadFile(fname);
	}

// use ajax to save-back data (instead of a web worker).
  saveFile(filepath, data)
{
	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	let me = this;
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&TIME="+(Date.now());;
	$.get(urlDateSet, function() {
		$.ajax(filepath, {
		headers:	{'Overwrite': 't', 'Content-type': "'" + this.content_type + "'"},
		cache:		false,
		contentType: false,
		data:		data,
		processData : false,
		method:		'PUT',
		error:		function(jqXHR, textStatus, errorThrown) {
			alert(textStatus + "\n" + errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			console.log("Save OK");
			$.ajax("/upload.cgi?WRITEPROTECT=OFF",{
				error:	function(jqXHR, textStatus, errorThrown) {
					alert(textStatus + "\n" + errorThrown);
				},
				headers: {"If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"},
				success: function(data, textStatus, jqXHR){
					console.log("save and unlock done");
					me.prefixId("status").text(filepath + " saved.");

				},
			})
		},
		
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
		  	xhr.upload.addEventListener("progress", function(evt){
			  if (evt.lengthComputable) {
				var percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				me.prefixId("status").text(filepath + " " + percentComplete + "%");
			  }
			}, false);
		 	return xhr;
		 }
		});
	});
}

 openFileDialog(e) {
	let me = this;
	let initial = this.fname;
	if (!initial) initial = this.defaultDir;
	openFileBrowser({
		initialPath:  initial,
		
		opener: function(name) {
			me.loadFile(name);
		}
	});
}
/*
  stepNextAsync(dir) {
  	let me = this;
	setTimeout(e=>{
		me.stepNextFile(me.fname, dir, openFile);
	}, 0);
  }
*/
  saveAs(){
	let me = this;
	let doc = this.homeDoc;
	if (!doc) return;
	saveFileBrowser({
		initialPath:  me.fname,
		saver: function(name) {
			let saveData = me.saveCallback(me, doc);
			me.saveFile(name, saveData);
			me.fname = name;
		}
	});
}

// Local stuff
  openFileLocal(evt) {
 	let me = this;
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var fname = f;
	var reader = new FileReader();
	if (me.dataType === 'text') {
		reader.onloadend = (function(theFile) {
			return function(e) {
				let t = e.target.result;
				me.loadCallback(t, theFile, me, me.homeDoc);
				me.fname = theFile;
				me.prefixId("status").text(fname + " loaded.");
			};
		})(f);
	} else {
		reader.onloadend = (function(theFileBlob) {
			me.loadCallback(theFileBlob, fname, me, me.homeDoc);
			me.fname = f.name;
		})(f);
	}
	reader.readAsBinaryString(f);
 }

 downloader(evt) {
 	if (!this.homeDoc) return;
 	let saveData = this.saveCallback(this, this.homeDoc);
	var blob = new Blob([saveData], {type: this.content_type});
	let saveName;
	if (local_exec) {
		saveName = this.fname.name;
	} else {
		if (!this.fname) this.fname = this.defaultName;
		saveName = this.fname.split('/').pop();
	}
	console.log(saveName);
	FileSaver.saveAs(blob, saveName);
}

 setupGUI() {
 	let me = this;

 	this.prefixId('new').click(e=>{if (me.newCallback) me.newCallback(e)});

 	this.prefixId('save').click(e=>{me.saveAs(e)});
 		
 	this.prefixId('open').click(e=>{me.openFileDialog(e)});

	this.prefixId('upbut').click(e=>{
		if (me.fname !== undefined) {
			stepNextFile(me.fname, -1, me.fileExtensions, (f)=>me.loadFile(f));
		}
	});

	this.prefixId('dwnbut').click(e=>{
		if (me.fname !== undefined) {
			stepNextFile(me.fname, 1, me.fileExtensions, (f)=>me.loadFile(f));
		}
	});

	this.prefixId('openlocal').on('change', e=>{
		me.openFileLocal(e);
	});

	this.prefixId('download').click(e=>{
		me.downloader(e);
	});
  }
}
  
  /*
  new
  save
  open
  status
  upbut
  downbut

  */
  
  
  export {FileManager};
  