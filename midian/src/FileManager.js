import $ from 'jquery';
import {openFileBrowser, saveFileBrowser, fileBrowserActive} from './FileBrowser.js';
import FileSaver from 'file-saver';
import {getActiveFS, getDropInFS} from "./FileStore.js";

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

	this.fs = getActiveFS();
  }

  prefixId(item) {
	return $("#" + this.prefix + item);
  }

  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	this.prefixId("status").text("Loading: " +  this.fname);
	this.fs = getActiveFS();
	this.fs.read(fname, me.dataType, function (data, status) {
		if (status === 'OK') {
			me.loadCallback(data, fname, me, me.homeDoc);
		} else {
			me.prefixId("status").text(status);
		}
		
	});
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
  export {FileManager};
  