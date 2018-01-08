/**
 *  main.js
 *
 *  Created by Junichi Kitano on 2013/05/15.
 * 
 *  Copyright (c) 2013, Fixstars Corporation
 *  All rights reserved.
 *  Released under the BSD 2-Clause license.
 *   http://flashair-developers.com/documents/license.html
 */
// JavaScript Document
//
// Set follwoing flag=true to allow Lua IDE access as well as general CodeMirror
var INCLUDE_FTLE = false;

// Convert data format from V1 to V2.
function convertFileList() {
	for (var i = 0; i < wlansd.length; i++) {
		var elements = wlansd[i].split(",");
		wlansd[i] = new Array();
		wlansd[i]["r_uri"] = elements[0];
		wlansd[i]["fname"] = elements[1];
		wlansd[i]["fsize"] = Number(elements[2]);
		wlansd[i]["attr"]  = Number(elements[3]);
		wlansd[i]["fdate"] = Number(elements[4]);
		wlansd[i]["ftime"] = Number(elements[5]);
	}
}
// Callback Function for sort()
function cmptime(a, b) {
    if( a["fdate"] == b["fdate"] ) {
        return a["ftime"] - b["ftime"];
    }else{
        return a["fdate"] - b["fdate"];
    }
}
// Show file list
function showFileList(path) {
	// Clear box.
	//$("#list").html('');
	$("#filetable tr").remove();
    // Output a link to the parent directory if it is not the root directory.
    if( path != "/" ) {
        var row = $("<tr></tr>");
        row.append(
        	$("<td></td>").append($("<span>..</span>")).append(
				$('<a href="javascript:dir(\'..\')" class="dir"></a>')
			).addClass("table_name")
        );
        row.append($("<td></td>").append($("<b><font color='#AAAAAA'>Edit</font></b><a href='javascript:void(0)'></a>")).addClass("table_bts"));
        row.append($("<td></td>").append($("<font color='#AAAAAA'>Del</font><a href='javascript:void(0)'></a>")).addClass("table_bts"));
        row.append($("<td></td>").append($("<font color='#AAAAAA'>Mov</font><a href='javascript:void(0)'></a>")).addClass("table_bts"));
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
		var filelink3 = $('<a href="javascript:void(0)"></a>');
		var filelink4 = $('<a href="javascript:void(0)"></a>');
		//var fileobj = $("<div></div>");

		var caption;
		var caption2;
		var caption3;
		
        filelink3.addClass("file").attr('href', "javascript:delfile('"+file["r_uri"] + '/' + file["fname"]+"')");
        filelink4.addClass("file").attr('href', "javascript:rename('"+file["r_uri"] + '/' + file["fname"]+"')");
		caption3 = "<font color='#FF0000'>Del</font>";
		caption4 = "<font color='#0000FF'>Mov</font>";
		
        if ( file["attr"] & 0x10 ) {
			caption = "<b>"+file["fname"]+"</b>";
			caption2 = "<b><font color='#AAAAAA'>Edit</font></b>";
            filelink.addClass("dir").attr('href', "javascript:dir('"+file["fname"]+"')");			
            filelink.addClass("dir");
        } else {
			var f = file["fname"].split('.');
			var ext = f[f.length-1].toLowerCase();
			
			caption = file["fname"];
			caption2 = "<b><font color='#FF0000'>Edit</font></b>";
            filelink.addClass("file").attr('href', "javascript:opensp('"+file["r_uri"] + '/' + file["fname"]+"',false)");			
            filelink2.addClass("file").attr('href', "javascript:opensp('"+file["r_uri"] + '/' + file["fname"]+"',true)");			
        }
		// Append a file entry or directory to the end of the list.
        var row = $("<tr></tr>");

        row.append(
        	$("<td></td>").append(caption).append(
				filelink.append()
			).addClass("table_name")
        );
        row.append(
        	$("<td></td>").append(caption2).append(
				filelink2.append()
			).addClass("table_bts")
        );
        row.append(
        	$("<td></td>").append(caption3).append(
				filelink3.append()
			).addClass("table_bts")
        );
        row.append(
        	$("<td></td>").append(caption4).append(
				filelink4.append()
			).addClass("table_bts")
        );

        $("#filetable").append(row);
    });     
}

function delfile(file)
{
	var result = confirm( "delete "+ file+ "?" );

	if(result){
	    var url = "/upload.cgi?DEL=" + file;
		$.get(url).done(function(data, textStatus, jqXHR){
			//alert("upload.cgi: "+data);
			upload_after();
		});
	}
}

function rename(file)
{
	var path = window.prompt(""+file+"\nMove for ?(full path with filename)\nEg. /DR/test.lua", file);
	if(path)
	{
		path = path.replace(/ /g , "|" ) ;
		file = file.replace(/ /g , "|" ) ;
		var url = "/SD_WLAN/FTF/move.lua?"+file+"%20"+path
	    $.get(url).done(function(data, textStatus, jqXHR){
			upload_after();
		});
	}
}

function opensp(file,conf)
{
	if(!conf)
	{
		window.open(file);	
	}else{
		// Open editor based on file type:
		var ext = file.split('.').pop().toLowerCase();
		if (ext === 'lua' && INCLUDE_FTLE) {
			window.open("/FTLE/edit.htm?"+file);
		} else {
			window.open("/DR/edit.htm?"+file);
		}
	}
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
	
	var url = "";
	if($("#FullFileList").prop('checked')) {
	    url = "/SD_WLAN/FTF/command100emu.lua?DIR=" + nextPath+"&TIME="+(Date.now());
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
        wlansd.sort(cmptime);
		
		// Show
		showFileList(currentPath);
	    var url = "/upload.cgi?UPDIR=" + nextPath+"&TIME="+(Date.now());
		$.get(url);
	}).fail(function(jqXHR, textStatus, errorThrown){
		//失敗した場合:エラー内容を表示
        var row = $("<tr></tr>");
		$("#filetable tr").remove();
		row.append(
			$("<td></td>").append($("<font color=red>Error:"+textStatus+"</font>")).addClass("table_name")
		);
		$("#filetable").append(row);
	});
}

var last_dirpath = "/";
//Document Ready
$(function() {
	//HTTPアクセスの設定を行います
	$.ajaxSetup({
		//cache: false,	//キャッシュ禁止するとなぜかロードできなくなる
		timeout: 30000	//30秒でタイムアウト。0で無効。単位はms
	});

    // Iniialize global variables.
    currentPath = location.pathname;
    last_dirpath = currentPath
    $("#header").html("<h1><a href='"+currentPath+"'>"+currentPath+"</a></h1>");
    
	wlansd = new Array();
	// Show the root directory.
    getFileList(makePath(''));
    // Register onClick handler for <a class="dir">
/*
    $(document).on("click","a.dir",function() {
    	var dirpath = makePath(this.text);
        $("#header").html("<h1>"+dirpath+"</h1>");
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
	$("#header").html("<h1><a href='"+dirpath+"'>"+dirpath+"</a></h1>");

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
function polling() {
    var url="/command.cgi?op=121&TIME="+(Date.now());
    $.get(url).done(function(data, textStatus, jqXHR){
        if(last_update_time < Number(data)) {
        	last_update_time = Number(data);
			getFileList(last_dirpath);
        	$("#reloadtime").html("<font color=red>"+(new Date()).toLocaleString())+"</font>";
        }else{
        	$("#reloadtime").html((new Date()).toLocaleString());
        }
    }).fail(function(jqXHR, textStatus, errorThrown){
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

function CreateFile()
{
	var path = window.prompt("File name?\n"+last_dirpath, "NewFile01");
	if(path)
	{
		var url = "";
		if(last_dirpath != "/")
		{
			url = "/SD_WLAN/FTF/new.lua?"+last_dirpath+"/"+path;
		}else{
			url = "/SD_WLAN/FTF/new.lua?"+"/"+path;		
		}
		url = url.replace(/ /g , "|" ) ;
		
	    $.get(url).done(function(data, textStatus, jqXHR){
			alert("CreateFile: "+data);
			upload_after();
		});
	}
}
function NewDirectory()
{
	var path = window.prompt("Directory name?\n"+last_dirpath, "NewDirectory01");
	if(path)
	{
		var url = "";
		if(last_dirpath != "/")
		{
			url = "/SD_WLAN/FTF/mkdir.lua?"+last_dirpath+"/"+path;
		}else{
			url = "/SD_WLAN/FTF/mkdir.lua?"+"/"+path;		
		}
		url = url.replace(/ /g , "|" ) ;
				
	    $.get(url).done(function(data, textStatus, jqXHR){
			alert("NewDirectory: "+data);
			upload_after();
		});
	}
}
function RemoveAllFiles()
{
	var pass = window.prompt("Are you sure you want to REMOVE ALL FILES in this directory?\n"+last_dirpath+"  To continue, type \"REMOVEALL\".", "");
	if(pass)
	{
		var url = '/SD_WLAN/FTF/delall.lua?'+last_dirpath+"%20"+pass;
		url = url.replace(/ /g , "|" ) ;
		window.open(url, '_blank');
		upload_after();
	}
}


function handleUpload() {
	
	alert("Meow");
}
