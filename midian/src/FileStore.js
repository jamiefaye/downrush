import $ from 'jquery';

// Abstract superclass for file operations with FlashAir, local, or cloud-based.

class FileStore {
	
  constructor() {

  }

  dir(nextPath, done) {
  }

	exists(path, done) {
	}

	read(path, done) {
	}

	write(path, data, filetype, done) {
	}

	delete(path, done) {
	}

	mkdir(path, done) {
	}

	rename(path, path2, done) {
	}
}

function splitPath(path) {
	return {
		prefix: "/",
		file: "",
	}
}

// Specialization of FileStore for FlashAir-based version.
class FlashAirFS extends FileStore {
	constructor() {
		super();
		this.currentDir = "";
		this.currentDirPath = "";
	}

  dir(nextPath, done) {
	let me = this;
	let url = "/command.cgi?op=100&DIR=" + nextPath+"&TIME="+(Date.now());

	// Issue CGI command.
	$.get(url).done(function(data, textStatus, jqXHR){
		// Split lines by new line characters.
		me.filelist = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		me.filelist.shift();
		me.filelist.pop();
		// Convert to V2 format.
		me.convertFileList(me.filelist);
		done(me.filelist, "OK");
	});
  }

  exists(path, callback) { // callback(exists, status)
	let parts = path.split('/');
	let fname = parts.pop();
	let dirPath = parts.join('/');
	if (dirPath === '') dirPath = '/';
	this.dir(dirPath, function(filelist, status) {
		if (status !== 'OK') {
			callback(false, status);
			return;
		}
		// See if the file we are curios about is there.
		for(var i = 0; i < filelist.length;++i) {
			let f = filelist[i];
			if (f['fname'] === fname) {
				callback(true, 'OK');
				return;
			}
		};
		callback(false, 'OK');
		return;

	});
  }

  read(fname, dataType, done) {
  	let me = this
	$.ajax({
	url         : fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		//me.loadCallback(data, fname, me, me.homeDoc);
		done(data, "OK");
	},

	error: function (data, textStatus, jqXHR) {
		done(undefined, textStatus);
		console.log("Error: " + textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType = dataType;
		return xhr;
	},

	});
  }

// kind: 'audio/wav', etc.
  write(filepath, data, kind, done, progress) {
	let me = this;
	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&TIME="+(Date.now());;
	$.get(urlDateSet, function() {
		$.ajax(filepath, {
		headers:	{'Overwrite': 't', 'Content-type': kind},
		cache:		false,
		contentType: false,
		data:		data,
		processData : false,
		method:		'PUT',
		error:		function(jqXHR, textStatus, errorThrown) {
			done(false, errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			$.ajax("/upload.cgi?WRITEPROTECT=OFF",{
				error:	function(jqXHR, textStatus, errorThrown) {
					done(false, errorThrown);
					// alert(textStatus + "\n" + errorThrown);
				},
				headers: {"If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"},
				success: function(data, textStatus, jqXHR){
					console.log("save and unlock done");
					done(true);
					if (progress) progress(100);
				},
			})
		},

		xhr: function() {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(evt){
			  if (progress && evt.lengthComputable) {
				let percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				progress(percentComplete);
			  }
			}, false);
		 	return xhr;
		 }
		});
	});
  }

  delete(path, done) {
	let parts = path.split('/');
	let fname = parts.pop();
	let dirPath = parts.join('/');
	if (dirPath === '') dirPath = '/';
	this.dir(dirPath, function (dirList, status) {
		if (status !== 'OK') {
			done(false, status);
			return;
		}
		this.deleteNext([fname], dirList, done);
	});
  }

// dirList = directory array that the zonkList files live inside. Used for recursive subdirectory deletion.
  deleteNext (zonkList, dirList, doneFunc)
{
	if (zonkList.length === 0) {
		doneFunc(true);
		return;
	}
	let me = this;
	let file = zonkList.shift();
	let fileEnc = encodeURIComponent(file);
	let url = "/upload.cgi?DEL=" + fileEnc;
	// Capture closure.
	let zonkFunc = function (status) {
		if (!status) {// Pass failure back up the stack.
			doneFunc(false);
			return;
		}
		$.get(url).done(function(data, textStatus, jqXHR){
			if (textStatus !== 'success') {
				doneFunc(false);
				return;
			}
		me.deleteNext(zonkList, dirList, doneFunc);
	   });	
	};

	if (isDirectoryEntry(file, dirList)) {
		this.dir(file, function (dirData, status) {
			let subZonk = [];
			// make a zonkList of the subdirectory contents.
			for (var i = 0; i < xlsd.length; ++i) {
				let subName = file + '/' + xlsd[i].fname;
				subZonk.push(subName);
			}
			me.deleteNext(subZonk, xlsd, zonkFunc);
		});
	} else zonkFunc(true);
}

  mkdir(path, done) {
	let url = "/DR/FTF/mkdir.lua?"+"/"+path;		
	url = url.replace(/ /g , "|" ) ;
	$.get(url).done(function(data, textStatus, jqXHR){
		done("OK");
	});
  }


  rename(path, path2, done) {
	path = path.replace(/ /g , "|" ) ;
	file = file.replace(/ /g , "|" ) ;
	var url = "/DR/FTF/move.lua?"+file+"%20"+path;
	$.get(url).done(function(data, textStatus, jqXHR){
		if(done) done(textStatus);
	});
  }

  convertFileList(fl) {
	for (var i = 0; i < fl.length; i++) {
		var elements = fl[i].split(",");
		fl[i] = new Array();
		fl[i]["r_uri"] = elements[0];
		var f = elements[1];
		fl[i]["fname"] = f;
		fl[i]["fsize"] = Number(elements[2]);
		fl[i]["attr"]  = Number(elements[3]);

		// Use Date() instead of FlashAir-specific date code.
		fl[i]["date"] = FADTtoJSDate(Number(elements[4]), Number(elements[5]));
		let isDir =(Number(elements[3]) & 0x10) !== 0;
		fl[i]["isDirectory"] = isDir;
		if(!isDir) {
			let fp = f.split('.');
			let ext = fp[fp.length-1].toLowerCase();
			fl[i]["ext"] = ext;
		}
	}
  }

} // End of class.

// FlashAir Date & Time to Javascript Date
function FADTtoJSDate(ftime, fdate) {
	let seconds = (ftime & 31) * 2;
	let minutes = (ftime >> 5) & 63;
	let hours   = (ftime >> 11) & 31;
	let day   = fdate & 31;
	let month = (fdate >> 5) & 15;
	let year  = ((fdate >> 9) & 127) + 1980;
	//if (year < 2000) return "";
	let date = new Date(year, month - 1, day, hours, minutes, seconds);
	return date;
}

function isDirectoryEntry(name, dirList)
{
	let itemName = name.split('/').pop();
	for (var i = 0; i < dirList.length; ++i) {
		let entry = dirList[i];
		if (entry.fname === itemName) {
			return entry.isDirectory;
		}
	}
	return false;
}

function zapSlash(fname) {
		if (fname.startsWith("/")) {
		return fname.substr(1);
	} else {
		return fname.substr(0);
	}
}

class DropInFS extends FileStore {
  constructor() {
		super();
		this.currentDir = "";
		this.currentDirPath = "";
		this.dirMap = {};
		this.fileMap = {};
	}

  addFiles(fileList) {
		for (let x in fileList) {
			let f = fileList[x];
			let fn = f.name;
			let fparts = fn.split('/');
			let ndirs = fparts.length - 1;
			let lastDir = this.dirMap;
			let fName = fparts[ndirs];
			// work our way down, creating directories as needed.
			for (let d = 0; d < ndirs; ++d) {
				let aPart = fparts[d];
				let dirObj = lastDir[aPart];
				if (!dirObj) {
					dirObj = {};
					lastDir[aPart] = dirObj;
				}
				lastDir = dirObj;
			}
			lastDir[fName] = f;
			this.fileMap[fn] = f;
		}
	}

// return a compatible file list corresponding to the given place in the dir hierarchy.
  fileListForPath(pathIn) {
	let dirPlace = this.dirMap;
	let path = zapSlash(pathIn);
	if (path !== "") {
	let parts = path.split('/');
		while (parts.length > 0) {
			let part = parts.shift();
			let nextPlace = dirPlace[part];
			if (nextPlace === undefined) {
				let newLvl = {};
				dirPlace[part] = newLvl;
				nextPlace = newLvl;
			}
			dirPlace = nextPlace;
		}
	}

	let fList = [];
	for (let p in dirPlace) {
		if (dirPlace.hasOwnProperty(p)) {
			let dm = dirPlace[p];
			let de = {fname: p, r_uri: path};
			if (dm instanceof File) {
				de["fsize"] = dm.size;
				de["attr"] = 0;
				de["date"] = dm.lastModifiedDate;
				de["isDirectory"] = false;
				let fp = p.split('.');
				if (fp.length > 1) {
					let ext = fp[fp.length-1].toLowerCase();
					de["ext"] = ext;
				}
			} else if (dm instanceof Object) {
				// Its a dir
				de["fsize"] = 0;
				de["attr"] = 0x10;
				de["isDirectory"] = true;
			}
			fList.push(de);
		}
	}
	return fList;
  }

  dir(nextPath, done) {
	let fl = this.fileListForPath(nextPath);
	done(fl, "OK");
  }

  read(fnameIn, dataType, done) {
  	let me = this;
//	var files = evt.target.files;
	let fnameZ = zapSlash(fnameIn);
	var f = me.fileMap[fnameZ];
	if (f === undefined) return;
	let fname = f;
	let reader = new FileReader();
	if (me.dataType === 'text') {
		reader.onloadend = (function(theFile) {
			return function(e) {
				let t = e.target.result;
				done(t, "OK");
			};
		})(f);
	} else {
		reader.onloadend = (function(theFileBlob) {
			done(theFileBlob, "OK");
		})(f);
	}
	reader.readAsBinaryString(f);
  }
}
var flashAirSingleton;

function getFlashAirFS() {
	if (!flashAirSingleton) {
		flashAirSingleton = new FlashAirFS();
		window.flashAir = flashAirSingleton;
	}
	return flashAirSingleton;
}

var dropInSingleton;

function getDropInFS() {	
	if (!dropInSingleton) {
		dropInSingleton = new DropInFS();
		window.dropIn = dropInSingleton;
	}
	return dropInSingleton;
}

function getActiveFS() {	
	if (dropInSingleton) {
		return dropInSingleton;
	}

	return getFlashAirFS();
}


export {FlashAirFS, getFlashAirFS, getDropInFS, getActiveFS};