import $ from'./js/jquery-3.2.1.min.js';
import Uppie from './js/uppie.js';

var INCLUDE_FTLE = false;

function convertFileList(fl) {
	for (var i = 0; i < fl.length; i++) {
		var elements = fl[i].split(",");
		fl[i] = new Array();
		fl[i]["r_uri"] = elements[0];
		fl[i]["fname"] = elements[1];
		fl[i]["fsize"] = Number(elements[2]);
		fl[i]["attr"]  = Number(elements[3]);
		fl[i]["fdate"] = Number(elements[4]);
		fl[i]["ftime"] = Number(elements[5]);
	}
}

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function makeDT(fdate, ftime) {
	let seconds = (ftime & 31) * 2;
	let minutes = (ftime >> 5) & 63;
	let hours   = (ftime >> 11) & 31;
	let day   = fdate & 31;
	let month = (fdate >> 5) & 15;
	let year  = ((fdate >> 9) & 127) + 1980;
	if (year < 2000) return "";
	return "" + month + '/' + day + '&nbsp;' + zeroPad(hours,2) + ':' + zeroPad(minutes,2);

}

function isDirectoryEntry(name, xlsd)
{
	let itemName = name.split('/').pop();
	for (var i = 0; i < xlsd.length; ++i) {
		let entry = xlsd[i];
		if (entry.fname === itemName) {
			if (entry.attr & 0x10) {
				 return true;
			} else return false;
		}
	}
	return false;
}

var editWhiteList = ['xml', 'js', 'htm', 'html', 'css', 'lua', 'wav'];
var editWhiteListSet = new Set(editWhiteList);

export default class FileBrowser {

// Convert data format from V1 to V2.
	constructor() {
		this.currentPath = '/';
		this.last_dirpath = "/";
		this.last_update_time = -1;
		this.polling_active = false;
		this.wlansd;
		this.sortOrder = 1;
		this.fieldNum = 0;
		let that = this;
		this.sortFunction = function(a, b) {
			if (!a["fname"]) return 0;
			return a["fname"].localeCompare(b["fname"]) * that.sortOrder;
		};
}

  toggleChecks (e) {
	var mcv = $('#headcheck').is(':checked');
	let tlist = $('.aBox');
	$.each(tlist, function(x) {
		$(this).prop('checked', mcv);
	});

}

  setSortFunction(fieldNum) {
	if (fieldNum === this.fieldNum) {
		this.sortOrder = -this.sortOrder;
	}
	this.fieldNum = fieldNum;
	let that = this;
	switch (fieldNum) {
case 0: 
	that.sortFunction = function(a, b) {
			if (!a["fname"]) return 0;
			return a["fname"].localeCompare(b["fname"]) * that.sortOrder;
		};
		break;
case 1:
	that.sortFunction = function(a, b) {
		if( a["fdate"] == b["fdate"] ) {
			return Math.sign(a["ftime"] - b["ftime"]) * that.sortOrder;
	} 	else {
			return Math.sign(a["fdate"] - b["fdate"]) * that.sortOrder;
		}
	};
	break;
case 2:
	that.sortFunction = function(a, b) {
		return Math.sign(a["fsize"] - b["fsize"]) * that.sortOrder;
	};
	break;
	}  // End of switch
	let recheckSet = new Set(that.getCheckedList());
	that.wlansd.sort(that.sortFunction);
	that.showFileList(that.currentPath, recheckSet);
}

// Show file list
  showFileList(path, recheckSet) {
	// Clear box.
	//$("#list").html('');
	$("#filetable tr").remove();
	let that = this;
	var row = $("<tr></tr>");
	row.append($("<td></td>").append($("<input id='headcheck' type='checkbox'></input>").addClass('tab_check')));
	row.append($("<td></td>").append($("<b>Name</b><a href='javascript:void(0)'></a>") ).addClass("table_bts").on('click',(e)=>{that.setSortFunction(0)}));
	row.append($("<td></td>").append($("<b>Time</b><a href='javascript:void(0)'></a>")).addClass("table_bts").on('click',(e)=>{that.setSortFunction(1)}));
	row.append($("<td></td>").append($("<b>Size</b><a href='javascript:void(0)'></a>")).addClass("table_bts").on('click',(e)=>{that.setSortFunction(2)}));
	row.append($("<td></td>").append($("<div>Edit</div><a href='javascript:void(0)'></a>")).addClass("table_cmd"));

	$("#filetable").append(row);
	$("#headcheck").on('click', ()=>{that.toggleChecks()});
	// Output a link to the parent directory if it is not the root directory.
	if( path != "/" ) {
		var row = $("<tr></tr>");
		row.append(
			$("<td colspan='2'></td>").append($("<span>..</span>")).append(
				$('<a href="javascript:void(0)"></a>').on('click', (e)=>{that.dir('..')})
			).addClass("table_name")
		);
		row.append($("<td colspan='5'></td>").append($("<b> </b><a href='javascript:void(0)'></a>")).addClass("table_bts"));
		$("#filetable").append(row);
	}
	$.each(that.wlansd, function() {
		var file = this;
		// Skip hidden file.
		//if ( file["attr"] & 0x02 ) {
		//	return;
		//}
		// Make a link to directories and files.
		var filelink = $('<a href="javascript:void(0)"></a>');
		var filelink2 = $('<a href="javascript:void(0)"></a>');

		var caption;
		var caption2;
		var filesize;
		var dateTime;

		if ( file["attr"] & 0x10 ) {
			caption = "<b>"+file["fname"]+"</b>";
			caption2 = "Edit";
			filelink.addClass("dir").attr('href', "javascript:void(0)");
			filelink.on('click', (e)=>{that.dir(file["fname"])});
			filelink.addClass("dir");
		} else {
			var f = file["fname"].split('.');
			var ext = f[f.length-1].toLowerCase();
			filesize = file["fsize"];
			dateTime = makeDT(file["fdate"], file["ftime"]);
			caption = file["fname"];

			filelink.addClass("file").attr('href', "javascript:void(0)");
			filelink.on('click', (e)=>{that.opensp(file["r_uri"] + '/' + file["fname"], false)});
			if (ext === 'lua' && INCLUDE_FTLE) {
				caption2 = "<font color='#FF0000'>Edit Lua</font>";
				filelink2.addClass("file").attr('href', "javascript:openedit('"+file["r_uri"] + '/' + file["fname"]+"')");
				filelink2.on('click', (e)=>{that.openedit(file["r_uri"] + '/' + file["fname"])});

			}
			if (editWhiteListSet.has(ext)) {
				caption2 = "<font color='#FF0000'>Edit</font>";
				filelink2.addClass("file").attr('href', "javascript:void(0)");
				filelink2.on('click', (e)=>{that.openedit(file["r_uri"] + '/' + file["fname"])});

			}
		}
		// Append a file entry or directory to the end of the list.
		var row = $("<tr></tr>");
		// Be careful if you rearrange the order of items, as the checkbox is assumed to be immediately to the left of the file name item.
		let isChecked = recheckSet.has(file['fname']) ? ' checked' : '';
		let checkText = "<input class='aBox' type='checkbox'" + isChecked + "></input>";
		row.append($("<td></td>").append(checkText).addClass('tab_check'));
		row.append(
			$("<td></td>").append(caption).append(
				filelink.append()
			).addClass("table_name")
		);
		row.append(
			$("<td></td>").append(dateTime)
			.addClass("table_dts")
		);
		row.append(
			$("<td></td>").append(filesize)
			.addClass("table_dts")
		);

		row.append(
			$("<td></td>").append(caption2).append(
				filelink2.append()
			).addClass("table_cmd")
		);

		$("#filetable").append(row);
	});
}

// Be careful if you rearrange the order of items, as the following code assumes
// the checkbox to be immediately to the left of the file name item.
  getCheckedList(prepend)
{
	if(prepend === undefined) prepend = "";
	var boxList = $('.aBox:checked');
	var checkList = [];
	for (var i = 0; i < boxList.length; ++i) {
		let cb = boxList[i];
		let fnameElem =  cb.parentElement.nextSibling.firstChild;
		let ntfname = prepend + fnameElem.textContent;
		checkList.push(ntfname);
	}
	return checkList;
}

  getCheckedSet() {
	return new Set(this.getCheckedList());
}

  deleteNext (zonkList, dirList, doneFunc)
{
	if (zonkList.length === 0) {
		doneFunc(true);
		return;
	}
	let that = this;
	let file = zonkList.shift();
	let url = "/upload.cgi?DEL=" + file;
	// Capture closure.
	let zonkFunc = function (status) {
		if (!status) {// Pass failure back up the stack.
			doneFunc(false);
			return;
		}
		$.get(url).done(function(data, textStatus, jqXHR){
			if (textStatus !== 'success') {
				alert(textStatus);
				doneFunc(false);
				return;
			}
		that.deleteNext(zonkList, dirList, doneFunc);
	   });	
	};

	if (isDirectoryEntry(file, dirList)) {
		var	dirurl = "/command.cgi?op=100&DIR=" + file +"&TIME="+(Date.now());
		$.get(dirurl).done(function(data, textStatus, jqXHR){
	   // Save the current path.
		// Split lines by new line characters.
		let xlsd = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		xlsd.shift();
		xlsd.pop();
		// Convert to V2 format.
		convertFileList(xlsd);
		let subZonk = [];
		// make a zonkList of the subdirectory contents.
		for (var i = 0; i < xlsd.length; ++i) {
			let subName = file + '/' + xlsd[i].fname;
			subZonk.push(subName);
		}
		// and recur.
		that.deleteNext(subZonk, xlsd, zonkFunc);
	  });
	} else zonkFunc(true);
}


  deleteFiles()
{
	var boxList = this.getCheckedList(this.currentPath + '/');
	var alertList = boxList.join('\n');
	var result = confirm( "Delete "+ alertList + "?" );
	let that = this;
	if (result) {
		this.deleteNext(boxList, this.wlansd, function () {
			that.upload_after();
		});
	}
}

  rename(file)
{
	var path = window.prompt(""+file+"\nMove (or rename) this file/directory to have the following full pathname:", file);
	let that = this;
	if(path)
	{
		path = path.replace(/ /g , "|" ) ;
		file = file.replace(/ /g , "|" ) ;
		var url = "/DR/FTF/move.lua?"+file+"%20"+path
		$.get(url).done(function(data, textStatus, jqXHR){
			that.upload_after();
		});
	}
}

  renameFile() {
	let boxList = this.getCheckedList(this.currentPath + '/');
	if (boxList.length === 0) {
		alert("Please select a file to rename or move using the checkbox");
		return;
	}
	if (boxList.length !== 1) {
		alert("More than one file is checked. We will only rename or move the first one");
	}
	this.rename(boxList[0]);
}

  opensp(file,conf)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'xml') {
		window.open("/DR/xmlView/viewXML.htm?"+file);
	} else {
		window.open(file);	
	}
}

  openedit(file)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'lua' && INCLUDE_FTLE) {
		window.open("/FTLE/edit.htm?"+file);
	} else if (ext === 'wav') {
		window.open("/DR/waverly/viewWAV.htm?"+file);
	} else if (editWhiteListSet.has(ext)) {
		window.open("/DR/edit.htm?"+file);
	}
}

  openspx(file) {
	window.open("/DR/xmlView/viewXML.htm?"+file);
// 	window.open("/DR/xmlEd/editXML.htm?"+file);
}


//Making Path
  makePath(dir) {
	var arrPath = this.currentPath.split('/');
	if (this.currentPath == "/" ) {
		arrPath.pop();
	}
	if ( dir == ".." ) {
		// Go to parent directory. Remove last fragment.
		arrPath.pop();
	} else if ( dir != "" && dir != "." ) {
		// Go to child directory. Append dir to the current path.
		arrPath.push(dir);
	}
	if ( arrPath.length == 1 ) {
		arrPath.push("");
	}
	return arrPath.join("/");
}

// Get file list
  getFileList(nextPath) { //dir
	// Make a path to show next.
	//var nextPath = this.makePath(dir);
	// Make URL for CGI. (DIR must not end with '/' except if it is the root.)
	let recheckSet = new Set();
	if (nextPath === this.currentPath) {
		recheckSet = new Set(this.getCheckedList());
	}
	let that = this;
	var url = "";
	if($("#FullFileList").prop('checked')) {
		url = "/DR/FTF/command100emu.lua?DIR=" + nextPath+"&TIME="+(Date.now());
	}else{
		url = "/command.cgi?op=100&DIR=" + nextPath+"&TIME="+(Date.now());
	}
	// Issue CGI command.
	$.get(url).done(function(data, textStatus, jqXHR){
	   // Save the current path.
		that.currentPath = nextPath;
		// Split lines by new line characters.
		that.wlansd = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		that.wlansd.shift();
		that.wlansd.pop();
		// Convert to V2 format.
		convertFileList(that.wlansd);
		// Sort by date and time.
		that.wlansd.sort(that.sortFunction);
		
		// Show
		that.showFileList(that.currentPath, recheckSet);
		var url = "/upload.cgi?UPDIR=" + nextPath+"&TIME="+(Date.now());
		$.get(url);
	}).fail(function(jqXHR, textStatus, errorThrown){
		// Failure: Display error contents
		var row = $("<tr></tr>");
		$("#filetable tr").remove();
		row.append(
			$("<td></td>").append($("<font color=red>Error:"+textStatus+"</font>")).addClass("table_name")
		);
		$("#filetable").append(row);
	});
}

  checkDownOne(goodPart, remaining, whenDone)
{
	if (remaining.length === 0) {
		whenDone(true);
		return;
	}
	let that = this;
	var	url = "/command.cgi?op=100&DIR=" + goodPart +"&TIME="+(Date.now());
	var seeking = remaining.shift();
	// Issue CGI command.
	$.get(url).done(function(data, textStatus, jqXHR){
	   // Save the current path.
		// Split lines by new line characters.
		let xlsd = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		xlsd.shift();
		xlsd.pop();
		// Convert to V2 format.
		convertFileList(xlsd);
		let found = false;
		for (var i = 0; i < xlsd.length; ++i) {
			let entry = xlsd[i];
			if (entry.fname === seeking) {
				 if (entry.attr !== 0x10) {
				 	whenDone(false);
				 	return;
				 }
				found = true;
				break;
			}
		}
		
		if (!found) {
			let dirpath = goodPart + '/' + seeking;
			let lurl = "/DR/FTF/mkdir.lua?"+"/" + dirpath;		
			lurl = lurl.replace(/ /g , "|" ) ;
				
		$.get(lurl).done(function(data, textStatus, jqXHR){
			if (textStatus !== 'success') {
				whenDone(false);
				return;				
			}
			let deeperGood = goodPart + '/' + seeking;
			that.checkDownOne(deeperGood, remaining, whenDone);
		});
		} else {
			let deeperGood = goodPart + '/' + seeking;
			that.checkDownOne(deeperGood, remaining, whenDone);
		}
	});
}

//Document Ready
  start() {
	// Configure HTTP access
	$.ajaxSetup({
		//cache: false,	// If you prohibit caching you can not load anyhow
		timeout: 300000	// Increased timeout value so as to not interfere with uploads.
	});

	// Iniialize global variables.
	this.currentPath = location.pathname;
	this.last_dirpath = this.currentPath
	$("#header").html("<a href='"+ this.currentPath+"'>"+ this.currentPath+"</a>");
	
	this.wlansd = new Array();
	// Show the root directory.
	this.getFileList(this.makePath(''));
	let that = this;

	let uppie = new Uppie();
	let duppy = document.querySelector('#uploader');
	uppie(duppy, function (event, formData, files) {
		var flist = [];
		for (var [key, value] of formData.entries()) { if(key === 'files[]') flist.push(value); }
		that.uploadNext(flist);
	});

	$('#uploadbut').click(e=>{that.upload()});
	$('#newdirbut').click(e=>{that.NewDirectory()});
	$('#deletebit').click(e=>{that.deleteFiles()});
	$('#renamebut').click(e=>{that.renameFile()});
	$('#reloadbut').click(e=>{that.reload_list()});

	// Register onClick handler for <a class="dir">
/*
	let that = this;
	$(document).on("click","a.dir",function() {
		var dirpath = this.makePath(this.text);
		$("#header").html("dirpath");
		$("#list").html("Loading...");
		that.getFileList(dirpath);
		
		that.last_dirpath = dirpath;
	}); 
*/
	this.polling();
	setInterval(()=>{that.polling()}, 5000);
}

  dir(fname)
{
	var dirpath = this.makePath(fname);
	$("#header").html("<a href='"+dirpath+"'>"+dirpath+"</a>");

	var row = $("<tr></tr>");
	$("#filetable tr").remove();
	row.append(
		$("<td></td>").append($("<span>Loading...</span>")).addClass("table_name")
	);
	$("#filetable").append(row);

	this.getFileList(dirpath);
	this.last_dirpath = dirpath;
}

//Callback Function for Polling

// During long uploads, polling requests were stacking up behind the upload
// We add an active flag. The flag prevents new requests from going
// out while one is active.
  polling() {
	if(this.polling_active) {
		return;
	}
	this.polling_active = true;
	let that = this;
	var url="/command.cgi?op=102";
	$.get(url).done(function(data, textStatus, jqXHR){
		that.polling_active = false;
		let hasUpd = Number(data);
		if(hasUpd) {
			that.getFileList(that.last_dirpath);
			$("#reloadtime").html("<font color=red>"+(new Date()).toLocaleString())+"</font>";
		}else{
			$("#reloadtime").html((new Date()).toLocaleString());
		}
	}).fail(function(jqXHR, textStatus, errorThrown){
		that.polling_active = false;
		$("#reloadtime").html("<font color=red>Error:"+textStatus+"</font>");
	});
}

  reload_list()
{
	this.getFileList(this.last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}

  upload(t)
{
	let that = this;
	setTimeout(()=>{that.upload_after()}, t ? t : 3000);
	return true;
}

  upload_after()
{
	this.getFileList(this.last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}

  NewDirectory()
{
	var path = window.prompt("Directory name?\n"+ this.last_dirpath, "NewDirectory01");
	if(path)
	{
		var url = "";
		if(this.last_dirpath != "/")
		{
			url = "/DR/FTF/mkdir.lua?"+ this.last_dirpath+"/"+path;
		}else{
			url = "/DR/FTF/mkdir.lua?"+"/"+path;		
		}
		url = url.replace(/ /g , "|" ) ;
		let that = this;
		$.get(url).done(function(data, textStatus, jqXHR){
			alert("NewDirectory: "+data);
			that.upload_after();
		});
	}
}


// Since upload.cgi can only handle one file at a time, do things one at a time.
 uploadNext (flist) {
	if (!flist.length) {
		$("#statind").text('Upload done.');
		this.upload(200); // trigger refresh when done.
		return;
	}
	let f = flist[0];
	let that = this;
// Create (if necessary) nested directories)
	var dirList = f.name.split('/');
	dirList.pop(); // Get rid of file name at the end.
	var uploadDirPath = this.currentPath + '/' + dirList.join('/');

	this.checkDownOne(this.currentPath, dirList, function (status) {
	if (!status) {
		// Could not create intermediate directories.
		alert("Unable to create intermediate directories");
		return;
	}
	var fd = new FormData();
	fd.append('file', f);
	// fd.append("upload_file", true);

	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	console.log(uploadDirPath);
	console.log(f.name);
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&UPDIR=" + uploadDirPath + "&TIME="+(Date.now());;
	var fName = f.name;
	$.get(urlDateSet, function() {
	 $.ajax({
	   url         : '/upload.cgi',
	   data        : fd,
	   cache       : false,
	   contentType : false,
	   processData : false,
	   method:		'POST',
	   type        : 'POST',
	   success     : function(data, textStatus, jqXHR){
		flist.shift();
		 that.uploadNext(flist);
		  },
	   xhr: function() {
		  var xhr = new window.XMLHttpRequest();
   
		  // Upload progress
		  xhr.upload.addEventListener("progress", function(evt){
			  if (evt.lengthComputable) {
				  var percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				  //Do something with upload progress
				  $("#statind").text(fName + " " + percentComplete + "%");
			  }
		 }, false);
		 return xhr;
	  },
	});
   });
 });
};


}; // End of class
