// Handlebars tamplates
var Handlebars = require('./js/handlebars.min.js');
var local_exec_head = Handlebars.compile(`			<table class='nobord'><tr>
				<td><input ID='opener' name="file" type="file" accept=".wav,.WAV" /></td>
				<!--
				<td><input type="button" value="Open" style="width:55pt" onclick="btn_open()" ></td>
				<td><input type="button" value="Save(F1)" style="width:55pt" onclick="btn_save()"></td>
				-->
			</tr>
			</table>`);

var local_exec_info = Handlebars.compile(`
You are running the local version of Waverly.
`);


var sfx_dropdn_template = Handlebars.compile(`<button id='dropbtn' class="dropbtn">Effects</button>
	<div id="droplist" class="dropdown-content">
	<a id='openfilter'>Filter</a>
/*
	<a onclick="openFilter('reverb')">Reverb</a>
	<a onclick="openFilter('delay')">Delay</a>
	<a onclick="openFilter('lowpass')">Lowpass Filter</a>
	<a onclick="openFilter('highpass')">Highpass Filter</a>
	<a onclick="openFilter('bandpass')">Bandpass Filter</a>
	<a onclick="openFilter('lowshelf')">Lowshelf Filter</a>
	<a onclick="openFilter('highshelf')">Highshelf Filter</a>
	<a onclick="openFilter('peaking')">Peaking Filter</a>
	<a onclick="openFilter('notch')">Notch Filter</a>
	<a onclick="openFilter('allpass')">Allpass Filter</a>
*/
 </div>`);

var filterheader = Handlebars.compile(`<div id='filterhdr'>
<button class="butn" id='fl_apply'>Apply</button>
<button class="butn" id='fl_cancel'>Close</button>
<input type='checkbox' id='fl_audition' checked>Audition</input>
</div>
`);

Handlebars.registerPartial("filterheader", filterheader);

var quadfilter_template = Handlebars.compile(`<div id='quadfilter'>
{{> filterheader}}
<table><tr>
<th>Kind</th>
<th>Frequency</th>
<th>Detune</th>
<th>Q</th>
<th>Gain</th>
</tr>
<tr>
<td>
<select id='qf_type'>
  <option value="lowpass">lowpass</option>
  <option value="highpass">highpass</option>
  <option value="bandpass">bandpass</option>
  <option value="lowshelf">lowshelf</option>
  <option value="highshelf">highshelf</option>
  <option value="peaking">peaking</option>
  <option value="notch">notch</option>
  <option value="allpass">allpass</option>
</select>
</td>

<td><input id='qf_frequency' type="text" value="440" class="dial" data-min="1" data-max="8000" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></td>
<td><input id='qf_detune' type="text" value="0" class="dial" data-min="-100" data-max="100" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></td>
<td><input id='qf_Q' type="text" value="1" class="dial" data-min="0" data-max="50" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></td>
<td><input id='qf_gain' type="text" value="0" class="dial" data-min="-40" data-max="40" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></td>
</tr>
</table>
</div>
`);


export {sfx_dropdn_template, local_exec_head, local_exec_info, filterheader, quadfilter_template};