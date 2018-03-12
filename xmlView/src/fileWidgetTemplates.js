var Handlebars = require('./js/handlebars.min.js');

var open_frame = Handlebars.compile(`
<div id="filewidget" class="modal">
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
</div>
`);

var save_frame = Handlebars.compile(`
<div id="filewidget" class="modal">
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
</div>
`);

var dir_template = Handlebars.compile(`
<table class='filetab' id='filetable'>
<tr>
<th class='nameh table_bts'>Name</th>
<th class='sizeh table_bts'>Size</th>
<th class='dateh table_bts'>Date</th>
</tr>
{{#unless atRootLevel}}
<tr>
<td class='table_name direntry' colspan='3'><span>..</span><a href="javascript:void(0)"/></td>
</tr>
{{/unless}}
{{#each filelist}}
{{#if isDirectory}}
<tr><td class='table_name direntry'><b>{{fname}}</b><a href="javascript:void(0)"/></td>
<td colspan='2'></td>
</tr>
{{else}}
<tr><td class='table_name fileentry'>{{fname}}<a href="javascript:void(0)"/></td>
<td class='table_dts'>{{fsize}}</td>
<td class='table_dts'>{{{formatDT this}}}</td>
</tr>
{{/if}}
{{/each}}
</table>
`);

export {open_frame, save_frame, dir_template};
