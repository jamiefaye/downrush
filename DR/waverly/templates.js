// Handlebars tamplates

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
var track_copy_template = Handlebars.compile(`<button class='clipbtn'trackno='{{trackIndex}}'><img src='img/copy-to-clipboard.png'/></button>`);
Handlebars.registerPartial("getcopytoclip", track_copy_template);


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


/* Template for Note tooltip
*/
var note_tip_template = Handlebars.compile(`
{{notename}} {{notevel}} {{noteprob}} {{notedur}} {{notestart}}
`);


/* Sample List
*/
var sample_list_template = Handlebars.compile(`<p class='tinygap'>
<table class='samplelist'>
<tr><th>Samples used in this song</th>
<th><input id='showdrums' type='checkbox' {{#if showDrums}} checked{{/if}}>Show /SAMPLES/DRUMS</input></th>
</tr>
{{#each sampList}}
<tr><td>{{this}}</td>
<td><audio controls class='smallplayer' preload='none' style='background-color: blue'><source src='{{../sample_path_prefix}}{{this}}' type='audio/wav'></audio></td>
</tr>
{{/each}}
</table>

`);


var paster_template = Handlebars.compile(`<hr><div>
			<b>Paste track data in field below to add it to song.</b><br>
			<textarea id='paster' rows='2' class='tinybox'></textarea>{{#if iOSDevice}}<br><input type='button' value='Add Track' id='iosSubmit'>{{/if}}
		</div><p class='tinygap'>`);


var sample_list_header = Handlebars.compile(`<tr class='kithead'>
<th class='kit_opener' kitItem='-1'>&#x25BA </th>
<th>Name</th>
<th>Path</th>
<th>Start</th>
<th>End</th>
<th>Player</th>
</tr>`);

var sample_entry_template = Handlebars.compile(`<tr class='kitentry'>
<td class='kit_opener' kitItem='{{index}}'>&#x25BA</td>
<td>{{name}}</td>
<td style='text-align: left'>{{osc1.fileName}}</td>
<td>{{fmttime osc1.zone.startMilliseconds}}</td>
<td>{{fmttime osc1.zone.endMilliseconds}}</td>
<td><audio controls class='smallplayer' preload='none' style='background-color: blue'><source src='{{sample_path_prefix}}{{osc1.fileName}}' type='audio/wav'></audio></td>
</tr>
{{#if osc2.fileName}}
<tr><td colspan='2'></td>
<td>{{osc2.fileName}}</td>
<td>{{fmttime osc2.zone.startMilliseconds}}</td>
<td>{{fmttime osc2.zone.endMilliseconds}}</td>
<td><controls audio class='smallplayer'  preload='none'><source src='{{sample_path_prefix}}{{osc2.fileName}}' type='audio/wav'></audio></td>
</tr>
{{/if}}
<div class='kit_spot'> <div>`);

var sample_name_prefix = Handlebars.compile(`<tr class='sampleprefix'>
<tr>
<td class='sampfile sample1' style='text-align: left' colspan='10'>{{osc1.fileName}}
<td class='sampfile sample1' colspan='6'><audio controls preload='none'><source src='{{sample_path_prefix}}{{osc1.fileName}}' type='audio/wav'></audio></td>
</tr>
{{#if osc2.fileName}}
<tr>
<td class='sampfile sample2' style='text-align: left' colspan='10'>{{osc2.fileName}}</td>
<td class='sampfile sample2'colspan='6'><audio controls preload='none'><source src='{{sample_path_prefix}}{{osc2.fileName}}' type='audio/wav'></audio></td>
</tr>
{{/if}}
`);
