import $ from 'jquery';
import {FileWidget} from './FileWidget.js';

require('file-loader?name=[name].[ext]!../css/filewidget.css');

var local_exec = document.URL.indexOf('file:') == 0;

/*
var fileopencb;

$('#hiddenfileopener').click((e)=>{fileopencb()});
*/

var open_frame = `<div id="filewidget" class="modal">
  <div class="filewidget">
	<div class="fw-header">
	  <span class="fw-close">&times;</span>
	  <h4>Select File to Open</h4>
	</div>
	<div class="fw-body">
			<div id="header">
			</div>
			<div class="wrapper">
			</div>
	</div>
	<div class="fw-footer">
	<table class='fw-btn-frame'><tr>
		<td width='100%'><label class='inlab'>Open:&nbsp;</label><span class='inspan'><div id='file_selected'></div></span></td>
		<td><input class='fw-but' id='openfilebut' type="button" value="Open"></td>
		<td><input class='fw-but' id='cancelbut' type="button" value="Cancel"></td>
	</tr></table>
  </div>
</div>`;

var save_frame = `<div id="filewidget" class="modal">
  <div class="filewidget">
	<div class="fw-header">
	  <span class="fw-close">&times;</span>
	  <h4>Save File</h4>
	</div>
	<div class="fw-body">
			<div id="header">
			</div>
			<div class="wrapper">
			</div>
	</div>
	<div class="fw-footer">
	<table class='fw-btn-frame'><tr>
		<td width='100%'><label class='inlab'>Save as:&nbsp;</label><span class='inspan'><input id="fw-name" class='fw-name'/></span></td>
		<td><input class='fw-but' id='savefilebut' type="button" value="Save"></td>
		<td><input class='fw-but' id='cancelbut' type="button" value="Cancel"></td>
	</tr></table>
  </div>
</div>`;

function setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

class FileBrowser {
  constructor(params) {
  	this.params = params || {};
  	let template = params.template;
  	let initialDir = params.initialPath;

	let html = template;
	$('#popupspot').append(html);
	let widg = $('#filewidget');
	widg.css('display', 'block');
	let me = this;
	$('.fw-close', widg).click(e=> {me.cancel(e)});
	let h = Math.min(Math.max(window.innerHeight / 2, 200), 450);
	// console.log(window.innerHeight + " " + h);
	$('.wrapper').css('height', h + 'px');

	this.browser = new FileWidget({initialDir: initialDir,
		fileSelected: (...args) => {me.fileSelect(...args)},
		dirCallback: (...args) => {me.dirSelect(...args)},
	});

	let openPlace = '/';
	if (initialDir) {
		let splits = initialDir.split('/');
		if (splits.length > 1) {
			splits.pop();
			openPlace = splits.join('/');
		}
	}
	this.dirPath = openPlace;
	this.browser.start(openPlace);
	$('#cancelbut').click(e=>{me.cancel(e)});
}

  cancel(e) {
	let widg = $('#filewidget');
	widg.css('display', 'none');
	$('#popupspot').empty();
  }

/*
  getSelectedFiles() {
	let selfiles = $('.file-select');
	if (selfiles && selfiles.length > 0) {
		let name = selfiles[0].firstChild.textContent;
		let fullName = this.browser.fullPathFor(name);
		console.log(fullName);
	} else {
		console.log('nobody');
	}

  }
*/


}; // End of class

class OpenFileBrowser extends FileBrowser {
  constructor(params) {
		params = params || {};
		params.template = open_frame;
		super(params);
		let me = this;
		setDisable($('#openfilebut'), true);
		this.previousSelectedFiles = new Set();
		this.selectedFileNames = [];
		this.lastDrop = -1;
		this.multi = params.multi;
		$('#openfilebut').click(e=>{me.openFile(e)});
		$('.fw-body').dblclick(e=>{me.openFile(e)});
	}

  openFile(e) {
	let cbf = this.params.opener;
	if (cbf) {
		cbf(this.selectedFileNames);
	}
	this.cancel();
  }

  fileSelect(browser, file, event, context) {
  	let multi = this.multi;
	let td = event.target.parentElement;

	let allFiles = $('.fileentry');
	let dropX = -1;
	for(let x in allFiles) {
		if(td === allFiles[x]) {
			dropX = x;
			break;
		}
	}
	//console.log("pos: " + dropX);

	// Update lastDrop if shift not down
	if (!multi || !event.shiftKey) {
		this.lastDrop = dropX;
	}

	let low = this.lastDrop;
	let high = dropX;

	if(high < low) {
		high = this.lastDrop;
		low = dropX;
	}

	// If Ctrl is held, initialize new selection set based on the previous one.
	let selSet;
	if (multi && event.metaKey) {
		selSet = new Set(this.previousSelectedFiles);
	} else {
		selSet = new Set();
	}
	// If Ctrl is held, and shift is not, and we have only one item and it was previously selected, remove it from new selection.
	if (event.metaKey && !event.shiftKey && this.previousSelectedFiles.has(td)) {
		selSet.delete(td);
	} else { // Otherwise add the range to the set.
		for(let x = low; x <= high; ++x) {
			selSet.add(allFiles[x]);
		}
	}

	if(!event.shiftKey) {
		this.previousSelectedFiles = selSet;
	}

	$('.fileentry').removeClass('file-select');

	this.selectedFileNames = [];
	let nameListStr = '';
	for(let sel of selSet) {
		let simpleName = sel.outerText;
		let fullPath = this.fullPathFor(simpleName);
		this.selectedFileNames.push(fullPath);
		if (nameListStr !== '') nameListStr += ', ';
		nameListStr += simpleName;
		$(sel).addClass('file-select');
	}
	$('#file_selected').text(nameListStr);
	setDisable($('#openfilebut'), this.selectedFileNames.length === 0);
  }

  dirSelect(browser, path) {
	// Invalidate on directory change.
	this.dirPath = path;
	this.selectedFileNames = [];
	$('#file_selected').empty();
	setDisable($('#openfilebut'), true);
 }

  fullPathFor(name) {
	if (this.dirPath === '/') return '/' + name;
	return this.dirPath + '/' + name;
  }

};

function addWaves(evt) {
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
}

function openFileBrowser (params) {
	if (!local_exec) {
		let fileBrowser = new OpenFileBrowser(params);
	} else {
		$('#hiddenfileopener').on('click', (e)=>{

			$('#hiddenfileopener').off('click');
			$('#hiddenfileopener').off('change');
			$('#hiddenfileopener').on('change', (evt)=>{
				var files = evt.target.files;
				var f = files[0];
				console.log(f);
				var path = (window.URL || window.webkitURL).createObjectURL(f);
    			console.log('path', path);
			});
		});

		$("#hiddenfileopener").click();
	}
}

class SaveFileBrowser extends FileBrowser {
  constructor(params) {
		params = params || {};
		params.template = save_frame;
		super(params);
		let me = this;
		let initName = params.initialPath;
		if (!initName) initName = '/SONG.XML';
		$('#fw-name').val(initName);
		$('#savefilebut').click(e=>{me.saveFile(e)});
	}

  fileSelect(browser, file, event, context) {
	let td = event.target.parentElement;
	$('#fw-name').val(file);
  }

  dirSelect(browser, path) {
	let nowName = $('#fw-name').val();
	if (!nowName) return;
	let splitup = nowName.split('/');
	let namePart = 'SONG.XML';
	if (splitup.length) {
		let lastPart = splitup[splitup.length - 1];
		if (lastPart) {
			namePart = lastPart;
		}
	}
	let newVal;
	if (path === '/') {
		newVal = '/' + namePart;
	} else {
		newVal = path + '/' + namePart;
	}
	$('#fw-name').val(newVal);
  }

  saveFile(e) {
	let cbf = this.params.saver;
	let saveName = $('#fw-name').val();
	if (cbf && saveName) {
		this.browser.doesFileExist(saveName, (exists, status)=>{
			if(exists) {
				let OK = confirm("The file named " + saveName + " already exists. Overwrite?");
				if (!OK) return;
			}
			cbf(saveName);
			this.cancel();
		});
	}
  }
};

function saveFileBrowser (params) {
	let fileBrowser = new SaveFileBrowser(params);
}

export {FileBrowser, openFileBrowser, saveFileBrowser};


