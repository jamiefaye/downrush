import $ from'./js/jquery-3.2.1.min.js';
import {openFileBrowser, saveFileBrowser, fileBrowserActive} from './FileBrowser.js';
import FileSaver from 'file-saver';
import {FlashAirFS} from "./FileStore.js";

var local_exec = document.URL.indexOf('file:') == 0 || buildType !='flashair';

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
	
	this.fs = new FlashAirFS();
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

	this.fs.read(fname, me.dataType, function (data, status) {
		if (status === 'OK') {
			me.loadCallback(data, fname, me, me.homeDoc);
		} else {
			me.prefixId("status").text(status);
		}
		
	});

/*
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
*/
}

  initialLoad(fname) {
		this.loadFile(fname);
	}

// use ajax to save-back data (instead of a web worker).
  saveFile(filepath, data)
{
	let me = this;	
	this.fs.write(filepath, data, "'" + this.content_type + "'", function (status) {
		me.prefixId("status").text(filepath + " saved.");
	}, function (percentdone) {
		me.prefixId("status").text(percentdone + '%');
	});
}

/*
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

*/
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

  stepNextFile(filePath, dir, okexts, callb) {
	let parts = filePath.split('/');
	let namePart = parts.pop(); // Get rid of file name at the end.
	let path = parts.join('/');
	this.fs.dir(path, function(dirList, status) {
		let fileList = dirList.filter(e=>!e.isDirectory);
		// Sort by file name
		fileList.sort(function(a, b) {
			if (!a["fname"]) return 0;
			return a["fname"].localeCompare(b["fname"]);
		});
	// Find the filePath in our list.
	let fx = -1;
	for (let i = 0; i < fileList.length; ++i) {
		let fn = fileList[i]["fname"];
		if (namePart === fn) {
			fx = i;
			break;
		}
	}
	let maxPass = fileList.length;
	if (fx >= 0) {
		let nextx = fx + dir;
		while (maxPass > 0) {
			if (nextx < 0) nextx = fileList.length - 1;
			if (nextx >= fileList.length) nextx = 0;

			let ext = fileList[nextx]["ext"];
			let found = okexts.find((element)=>{return element === ext});
			if (found !== undefined) {
				let nextF = path + "/" + fileList[nextx]["fname"];
				callb(nextF);
				return;
			}
			nextx += dir;
			if (nextx < 0) nextx = fileList.length - 1;
			if (nextx >= fileList.length) nextx = 0;
			maxPass--; 
		}
	}
	});
}

 setupGUI() {
 	let me = this;

 	this.prefixId('new').click(e=>{if (me.newCallback) me.newCallback(e)});

 	this.prefixId('save').click(e=>{me.saveAs(e)});
 		
 	this.prefixId('open').click(e=>{me.openFileDialog(e)});

	this.prefixId('upbut').click(e=>{
		if (me.fname !== undefined) {
			me.stepNextFile(me.fname, -1, me.fileExtensions, (f)=>me.loadFile(f));
		}
	});

	this.prefixId('dwnbut').click(e=>{
		if (me.fname !== undefined) {
			me.stepNextFile(me.fname, 1, me.fileExtensions, (f)=>me.loadFile(f));
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
  