// Mustache tamplates
var track_head_template = `<table>
<tr><th>Section</th>
<th>Type</th>
<th>Preset #</th>
<th>Name</th>
<th>Length</th>
<th>Colour</th>
<th>Source</th>
</tr>
<tr>
<td>{{section}}</td>
<td>{{kindName}}</td>
<td>{{patch}}</td>
<td>{{patchName}}</td>
<td>{{len}}</td>
<td>{{colourOffset}}</td>
<td>{{source}}</td>
</tr>
</table>`;

var track_copy_template = `<input type='button' class='clipbtn' value='Copy To Clipboard' trackno='{{trackNum}}'><p/>`;

var paster_template = `<hr><div>
			<b>Paste track data in field below to add it to song.</b><br>
			<textarea id='paster' rows='2' class='tinybox'></textarea>{{#iOSDevice}}<br><input type='button' value='Add Track' id='iosSubmit'>{{/iOSDevice}}
		</div><br><hr>`;

