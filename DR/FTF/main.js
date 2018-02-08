/**
 *  main.js
 *
 *  Created by Junichi Kitano on 2013/05/15.
 *  Many mods by Jamie Faye Fenton 2018
 *  Copyright (c) 2013, Fixstars Corporation
 *  All rights reserved.
 *  Released under the BSD 2-Clause license.
 *   http://flashair-developers.com/documents/license.html
 */
// JavaScript Document
//
// Set follwoing flag=true to allow Lua IDE access as well as general CodeMirror
var INCLUDE_FTLE = false;

var editWhiteList = ['xml', 'js', 'htm', 'html', 'css', 'lua'];
var editWhiteListSet = new Set(editWhiteList);

// Convert data format from V1 to V2.
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

var sortOrder = 1;

// Callback Function for sort()
function cmptime(a, b) {
	if( a["fdate"] == b["fdate"] ) {
		return Math.sign(a["ftime"] - b["ftime"]) * sortOrder;
	}else {
		return Math.sign(a["fdate"] - b["fdate"]) * sortOrder;
	}
}

// Callback Function for sort by name
function cmpfname(a, b) {
	if (!a["fname"]) return 0;
	return a["fname"].localeCompare(b["fname"]) * sortOrder;

}

// Callback Function for sort by size
function cmpfsize(a, b) {
	return Math.sign(a["fsize"] - b["fsize"]) * sortOrder;

}

var sortFunction = cmpfname;
var sortFunctionTab = [cmpfname, cmptime, cmpfsize];

function toggleChecks (e) {
	var mcv = $('#headcheck').is(':checked');
	let tlist = $('.aBox');
	$.each(tlist, function(x) {
		$(this).prop('checked', mcv);
	});

}

function setSortFunction(fieldNum) {
	let sf = sortFunctionTab[fieldNum];
	if(sortFunction === sf) { sortOrder = -sortOrder; }
	else sortFunction = sf;
	let recheckSet = new Set(getCheckedList());
	wlansd.sort(sortFunction);
	showFileList(currentPath, recheckSet);
}

// Show file list
function showFileList(path, recheckSet) {
	// Clear box.
	//$("#list").html('');
	$("#filetable tr").remove();

	var row = $("<tr></tr>");
	row.append($("<td></td>").append($("<input id='headcheck' type='checkbox'></input>").addClass('tab_check')));
	row.append($("<td></td>").append($("<b>Name</b><a href='javascript:setSortFunction(0)'></a>")).addClass("table_bts"));
	row.append($("<td></td>").append($("<b>Time</b><a href='javascript:setSortFunction(1)'></a>")).addClass("table_bts"));
	row.append($("<td></td>").append($("<b>Size</b><a href='javascript:setSortFunction(2)'></a>")).addClass("table_bts"));
	row.append($("<td></td>").append($("<div>Edit</div><a href='javascript:void(0)'></a>")).addClass("table_cmd"));
	$("#filetable").append(row);
	$("#headcheck").on('click', toggleChecks);
	// Output a link to the parent directory if it is not the root directory.
	if( path != "/" ) {
		var row = $("<tr></tr>");
		row.append(
			$("<td colspan='2'></td>").append($("<span>..</span>")).append(
				$('<a href="javascript:dir(\'..\')" class="dir"></a>')
			).addClass("table_name")
		);
		row.append($("<td colspan='5'></td>").append($("<b> </b><a href='javascript:void(0)'></a>")).addClass("table_bts"));
		$("#filetable").append(row);
	}
	$.each(wlansd, function() {
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
			filelink.addClass("dir").attr('href', "javascript:dir('"+file["fname"]+"')");			
			filelink.addClass("dir");
		} else {
			var f = file["fname"].split('.');
			var ext = f[f.length-1].toLowerCase();
			filesize = file["fsize"];
			dateTime = makeDT(file["fdate"], file["ftime"]);
			caption = file["fname"];

			filelink.addClass("file").attr('href', "javascript:opensp('"+file["r_uri"] + '/' + file["fname"]+"',false)");
		   
			if (ext === 'lua' && INCLUDE_FTLE) {
				caption2 = "<font color='#FF0000'>Edit Lua</font>";
				filelink2.addClass("file").attr('href', "javascript:openedit('"+file["r_uri"] + '/' + file["fname"]+"')");
			}
			if (editWhiteListSet.has(ext)) {
				caption2 = "<font color='#FF0000'>Edit</font>";
				filelink2.addClass("file").attr('href', "javascript:openedit('"+file["r_uri"] + '/' + file["fname"]+"')");
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
function getCheckedList(prepend)
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

function getCheckedSet() {
	return new Set(getCheckedList);
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

function deleteNext (zonkList, dirList, doneFunc)
{
	if (zonkList.length === 0) {
		doneFunc(true);
		return;
	}

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
		deleteNext(zonkList, dirList, doneFunc);
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
		subZonk = [];
		// make a zonkList of the subdirectory contents.
		for (var i = 0; i < xlsd.length; ++i) {
			let subName = file + '/' + xlsd[i].fname;
			subZonk.push(subName);
		}
		// and recur.
		deleteNext(subZonk, xlsd, zonkFunc);
	  });
	} else zonkFunc(true);
}


function deleteFiles()
{
	var boxList = getCheckedList(currentPath + '/');
	var alertList = boxList.join('\n');
	var result = confirm( "Delete "+ alertList + "?" );
	if (result) {
		deleteNext(boxList, wlansd, function () {
			upload_after();
		});
	}
}

function rename(file)
{
	var path = window.prompt(""+file+"\nMove (or rename) this file/directory to have the following full pathname:", file);
	if(path)
	{
		path = path.replace(/ /g , "|" ) ;
		file = file.replace(/ /g , "|" ) ;
		var url = "/DR/FTF/move.lua?"+file+"%20"+path
		$.get(url).done(function(data, textStatus, jqXHR){
			upload_after();
		});
	}
}

function renameFile() {
	let boxList = getCheckedList(currentPath + '/');
	if (boxList.length === 0) {
		alert("Please select a file to rename or move using the checkbox");
		return;
	}
	if (boxList.length !== 1) {
		alert("More than one file is checked. We will only rename or move the first one");
	}
	rename(boxList[0]);
}

function opensp(file,conf)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'xml') {
		window.open("/DR/xmlView/viewXML.htm?"+file);
	} else {
		window.open(file);	
	}
}

function openedit(file)
{
	// Open editor based on file type:
	var ext = file.split('.').pop().toLowerCase();
	if (ext === 'lua' && INCLUDE_FTLE) {
		window.open("/FTLE/edit.htm?"+file);
	} else if (editWhiteListSet.has(ext)) {
		window.open("/DR/edit.htm?"+file);
	}
}

function openspx(file) {
	window.open("/DR/xmlView/viewXML.htm?"+file);
// 	window.open("/DR/xmlEd/editXML.htm?"+file);
}


//Making Path
function makePath(dir) {
	var arrPath = currentPath.split('/');
	if ( currentPath == "/" ) {
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
function getFileList(nextPath) { //dir
	// Make a path to show next.
	//var nextPath = makePath(dir);
	// Make URL for CGI. (DIR must not end with '/' except if it is the root.)
	let recheckSet = new Set();
	if (nextPath === currentPath) {
		recheckSet = new Set(getCheckedList());
	}

	var url = "";
	if($("#FullFileList").prop('checked')) {
		url = "/DR/FTF/command100emu.lua?DIR=" + nextPath+"&TIME="+(Date.now());
	}else{
		url = "/command.cgi?op=100&DIR=" + nextPath+"&TIME="+(Date.now());
	}
	// Issue CGI command.
	$.get(url).done(function(data, textStatus, jqXHR){
	   // Save the current path.
		currentPath = nextPath;
		// Split lines by new line characters.
		wlansd = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		wlansd.shift();
		wlansd.pop();
		// Convert to V2 format.
		convertFileList(wlansd);
		// Sort by date and time.
		wlansd.sort(sortFunction);
		
		// Show
		showFileList(currentPath, recheckSet);
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

var last_dirpath = "/";

function checkDownOne(goodPart, remaining, whenDone)
{
	if (remaining.length === 0) {
		whenDone(true);
		return;
	}
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
			checkDownOne(deeperGood, remaining, whenDone);
		});
		} else {
			let deeperGood = goodPart + '/' + seeking;
			checkDownOne(deeperGood, remaining, whenDone);
		}
	});
}

//Document Ready
$(function() {
	// Configure HTTP access
	$.ajaxSetup({
		//cache: false,	// If you prohibit caching you can not load anyhow
		timeout: 300000	// Increased timeout value so as to not interfere with uploads.
	});

	// Iniialize global variables.
	currentPath = location.pathname;
	last_dirpath = currentPath
	$("#header").html("<a href='"+currentPath+"'>"+currentPath+"</a>");
	
	wlansd = new Array();
	// Show the root directory.
	getFileList(makePath(''));
	// Register onClick handler for <a class="dir">
/*
	$(document).on("click","a.dir",function() {
		var dirpath = makePath(this.text);
		$("#header").html("dirpath");
		$("#list").html("Loading...");
		getFileList(dirpath);
		
		last_dirpath = dirpath;
	}); 
*/
	polling();
	setInterval(polling, 5000);
});

function dir(fname)
{
	var dirpath = makePath(fname);
	$("#header").html("<a href='"+dirpath+"'>"+dirpath+"</a>");

	var row = $("<tr></tr>");
	$("#filetable tr").remove();
	row.append(
		$("<td></td>").append($("<span>Loading...</span>")).addClass("table_name")
	);
	$("#filetable").append(row);

	getFileList(dirpath);
	last_dirpath = dirpath;
}

//Callback Function for Polling
var last_update_time = 0;

// During long uploads, polling requests were stacking up behind the upload
// We add an active flag. The flag prevents new requests from going
// out while one is active.
var polling_active = false;

function polling() {
	if(polling_active) {
		return;
	}
	polling_active = true;
	var url="/command.cgi?op=121&TIME="+(Date.now());

	$.get(url).done(function(data, textStatus, jqXHR){
		polling_active = false;
		if(last_update_time < Number(data)) {
			last_update_time = Number(data);
			getFileList(last_dirpath);
			$("#reloadtime").html("<font color=red>"+(new Date()).toLocaleString())+"</font>";
		}else{
			$("#reloadtime").html((new Date()).toLocaleString());
		}
	}).fail(function(jqXHR, textStatus, errorThrown){
		polling_active = false;
		//失敗した場合:エラー内容を表示
		$("#reloadtime").html("<font color=red>Error:"+textStatus+"</font>");
	});
}

function reload_list()
{
	getFileList(last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}

function upload(t)
{
	setTimeout(upload_after, t ? t : 3000);
	return true;
}

function upload_after()
{
	getFileList(last_dirpath);
	$("#reloadtime").html("<font color=blue>"+(new Date()).toLocaleString())+"</font>";
}


function NewDirectory()
{
	var path = window.prompt("Directory name?\n"+last_dirpath, "NewDirectory01");
	if(path)
	{
		var url = "";
		if(last_dirpath != "/")
		{
			url = "/DR/FTF/mkdir.lua?"+last_dirpath+"/"+path;
		}else{
			url = "/DR/FTF/mkdir.lua?"+"/"+path;		
		}
		url = url.replace(/ /g , "|" ) ;
				
		$.get(url).done(function(data, textStatus, jqXHR){
			alert("NewDirectory: "+data);
			upload_after();
		});
	}
}

var uppie = new Uppie();
// Since upload.cgi can only handle one file at a time, do things one at a time.
var uploadNext = function(flist) {
	if (!flist.length) {
		$("#statind").text('Upload done.');
		upload(200); // trigger refresh when done.
		return;
	}
	let f = flist[0];

// Create (if necessary) nested directories)
	var dirList = f.name.split('/');
	dirList.pop(); // Get rid of file name at the end.
	var uploadDirPath = currentPath + '/' + dirList.join('/');

	checkDownOne(currentPath, dirList, function (status) {
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
		  uploadNext(flist);
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
