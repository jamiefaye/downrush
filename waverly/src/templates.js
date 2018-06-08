// Handlebars tamplates
var Handlebars = require('./js/handlebars.min.js');
var local_exec_head = Handlebars.compile(`			<table class='nobord'><tr>
				<td><input id='opener' name="file" type="file" accept=".wav,.WAV" /></td>
				<td><input id='downloadbut' type="button" value="Download" style="width:55pt" ></td>
			</tr>
			</table>`);

var local_exec_info = Handlebars.compile(`
You are running the local version of Waverly.
`);


var button_row_template = Handlebars.compile(`
<button class="butn zoominbut" title='Zoom in'><img src='img/glyphicons-237-zoom-in.png'/></button>
<button class='butn zoomoutbut'  title='Zoom out'><img src='img/glyphicons-238-zoom-out.png'/></button>
<button class='butn rewbut' title='Back to start'><img src='img/glyphicons-172-fast-backward.png'/></button>
<button class='butn plsybut' title='Play'><img width='16px'height='18px' class='playbutimg' src='img/glyphicons-174-play.png'/></button>
<button class='butn plsyselbut' title='Play selected'><img src='img/glyphicons-221-play-button.png'/></button>
<button class='butn undobut' title='Undo'><img src='img/glyphicons-436-undo.png'/></button>
<button class='butn redobut' title='Redo'><img src='img/glyphicons-435-redo.png'/></button>
<button class='butn selallbut' title='Select All'><img src='img/glyphicons-729-resize-horizontal.png'/></button>
<button class='butn delbut' title='Delete'>DEL</button>
<button class='butn cutbut' title='Cut to clipboard'><img src='img/glyphicons-599-scissors-alt.png'/></button>
<button class='butn copybut' title='Copy to clipboard'><img src='img/glyphicons-512-copy.png'/></button>
<button class='butn pastebut' title='Paste from clipboard'><img src='img/glyphicons-513-paste.png'/></button>
<table><tr>
<td><div id='dropdn{{idsuffix}}'></div></td>
<td><button class='butn trimbut'>Trim</button></td>
<td><button class='butn cropbut'>Crop</button></td>
<td><button class='butn normbut'>Normalize</button></td>
<td><button class='butn reversebut'>Reverse</button></td>
<td><button class='butn fadeinbut'>Fade In</button></td>
<td><button class='butn fadeoutbut'>Fade Out</button></td>
</tr>
</table>
`);

Handlebars.registerPartial("buttonrow", button_row_template);

var filegroup_template = Handlebars.compile(`
<div id='wavegroup{{idsuffix}}'>
<div id='jtab{{idsuffix}}'> </div>
<div id="waveform{{idsuffix}}"></div>
<div id="waveform{{idsuffix}}-timeline"></div>
<div id="waveform{{idsuffix}}-minimap"></div>
<div class='butnrow' id='butnrow{{idsuffix}}'>
{{> buttonrow}}
</div>
<div id='procmods{{idsuffix}}'>
</div>
</div>
`);

var sfx_dropdn_template = Handlebars.compile(`<button class="dropbtn">Effects &#x25bc;</button>
	<div class="dropdown-content">
	<a data-id='openfilter'>Quad Filter</a>
	<a data-id='openReverb'>Simple Reverb</a>
	<a data-id='openDelay'>Delay</a>
	<a data-id='openOsc'>Oscillator</a>
 </div>`);

var quad_dropdn_template = Handlebars.compile(`<button id='quadpop' class="dropbtn">Lowpass Filter &#x25bc;</button>
	<div class="dropdown-content">
	<a data-id='lowpass'>Lowpass Filter</a>
	<a data-id='highpass'>Highpass Filter</a>
	<a data-id='bandpass'>Bandpass Filter</a>
	<a data-id='lowshelf'>Lowshelf Filter</a>
	<a data-id='highshelf'>Highshelf Filter</a>
	<a data-id='peaking'>Peaking Filter</a>
	<a data-id='notch'>Notch Filter</a>
	<a data-id='allpass'>Allpass Filter</a>
 </div>`);
Handlebars.registerPartial("quaddropdn", quad_dropdn_template);

var filter_frame_template = Handlebars.compile(`<div class='filterhdr'>
<table><tr>
<td><button class='butn fl_apply'>Apply</button></td>
<td><button class='butn fl_cancel'>Close</button></td>
<td><input type='checkbox' class='audchbox fl_audition' checked><span class='cboxtext'>Audition</span></input></td>
</tr></table>
<div class ='filterbody'>
</div>
</div>
`);

// Handlebars.registerPartial("filterheader", filterheader);

var quadfilter_template = Handlebars.compile(`<div id='quadfilter'>
<table>
<tr>
<td><div class='quaddropdn'>{{> quaddropdn}}</div></td>
<td><input data-id='frequency' type="text" value="440" class="dial" data-min="1" data-max="8000" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></td>
<td><div class='q_div'><input data-id='Q' type="text" value="1" class="dial" data-min="0" data-max="50" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'</div></td>
<td><div class='gain_div'><input data-id='gain' type="text" value="0" class="dial" data-min="-40" data-max="40" data-angleArc="300" data-angleOffset="30" data-width='128' data-height='128'></div></td>
</tr>
<tr>
<th>Kind</th>
<th>Frequency</th>
<th><div class='q_div'>Q</div></th>
<th><div class='gain_div'>Gain</div></th>
</tr>
</table>
</div>
`);

var reverb_template = Handlebars.compile(`<div class='simplereverb'>
<table>
<tr>
<td><input data-id='drylevel' type="text" value="5" class="dial" data-min="0" data-max="10" data-step='0.1' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='wetlevel' type="text" value="5" class="dial" data-min="0" data-max="10" data-step='0.1' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='seconds' type="text" value="3" class="dial" data-min="0.01" data-max="30"  data-step='0.1' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='decay' type="text" value="2" class="dial" data-min="0" data-max="100" data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='reverse' type="text" value="0" class="dial" data-min="0" data-max="1" data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
</tr>
<tr>
<th>Dry Level</th>
<th>Wet Level</th>
<th>Seconds</th>
<th>Decay</th>
<th>Reverse</th>
</tr>
</table>
</div>
`);

var delay_template = Handlebars.compile(`<div class='delay'>
<table>
<tr>
<th colspan='6'>Delay Filter</th>
</tr>
<tr>
<td>
<div class='delaydropdn'><button class="dropbtn">Kind &#x25bc;</button>
	<div class="dropdown-content">
	<a data-id='normal'>Normal</a>
	<a data-id='inverted'>Inverted</a>
	<a data-id='pingpong'>PingPong</a>
 </div>
</div>
</td>
<td><input data-id='delay' type="text" value="1" class="dial" data-min="0" data-max="2" data-step='0.01' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='feedback' type="text" value="0.5" class="dial" data-min="0" data-max="1.0" data-step='0.01' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='cutoff' type="text" value="8000" class="dial" data-min="0" data-max="22050" data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='offset' type="text" value="0" class="dial" data-min="-0.5" data-max="0.5" data-step='0.01'  data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='dry' type="text" value="1" class="dial" data-min="0" data-max="1" data-step='0.01' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
</tr>
<tr>
<th>Type</th>
<th>Delay</th>
<th>Feedback</th>
<th>Cutoff</th>
<th>Offset</th>
<th>Dry</th>
</tr>
</table>
</div>
`);

var osc_template = Handlebars.compile(`<div class='osc'>
<table>
<tr>
<th colspan='6'>Oscillator</th>
</tr>
<tr>
<td>
<div class='oscdropdn'><button class="dropbtn">Type &#x25bc;</button>
	<div class="dropdown-content">
	<a data-id='sine'>Sine</a>
	<a data-id='square'>Square</a>
	<a data-id='sawtooth'>Sawtooth</a>
	<a data-id='triangle'>Triangle</a>
 </div>
</div>
</td>
<td><input data-id='frequency' type="text" value="440" class="dial" data-min="0" data-max="7040"  data-step='1' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><input data-id='gain' type="text" value="0.80" class="dial" data-min="0" data-max="1.00" data-step='0.01' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></td>
<td><div class='oscDur'><input data-id='duration' type="text" value="0" class="dial" data-min="0" data-max="10" data-step='0.01' data-angleArc="300" data-angleOffset="210" data-width='128' data-height='128'></div></td>
</tr>
<tr>
<th>Type</th>
<th>Frequency</th>
<th>Gain</th>
<th><div class='oscDur'>Duration</div></th>
</tr>
</table>
</div>
`);

export {filegroup_template, sfx_dropdn_template, local_exec_head, local_exec_info, filter_frame_template, quadfilter_template, quad_dropdn_template, reverb_template, delay_template, osc_template};