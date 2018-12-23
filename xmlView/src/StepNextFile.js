import $ from 'jquery';

function getFilesOnly(fl) {
	let listOut = new Array();
	for (var i = 0; i < fl.length; i++) {
		var elements = fl[i].split(",");
		let isDir =(Number(elements[3]) & 0x10) !== 0;
		if (isDir) {
			continue;
		}
		let frec = {};
		frec["r_uri"] = elements[0];
		var f = elements[1];
		frec["fname"] = f;
		frec["fsize"] = Number(elements[2]);
		frec["attr"]  = Number(elements[3]);
		frec["fdate"] = Number(elements[4]);
		frec["ftime"] = Number(elements[5]);
		let fp = f.split('.');
		let ext = fp[fp.length-1].toLowerCase();
		frec["ext"] = ext;
		listOut.push(frec);
	}
	
	return listOut;
}

// Get file list
  function stepNextFile(filePath, dir, callb) {
	let parts = filePath.split('/');
	let namePart = parts.pop(); // Get rid of file name at the end.
	let path = parts.join('/');
	let url = "/command.cgi?op=100&DIR=" + path+"&TIME="+(Date.now());

	// Issue CGI command.
	$.get(url).done(function(data, textStatus, jqXHR){
		// Split lines by new line characters.
		let fileList = data.split(/\n/g);
		// Ignore the first line (title) and last line (blank).
		fileList.shift();
		fileList.pop();
		// Convert to V2 format.
		fileList = getFilesOnly(fileList);
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
	if (fx >= 0) {
		let nextx = fx + dir;
		if (nextx < 0) nextx = fileList.length - 1;
		if (nextx >= fileList.length) nextx = 0;
		let nextF = path + "/" + fileList[nextx]["fname"];
		callb(nextF);
	}
	}).fail(function(jqXHR, textStatus, errorThrown){
		// Failure: Display error contents
	});
}

export {stepNextFile};