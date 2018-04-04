import Handlebars from './js/handlebars.min.js';

/*******************************************************************************

		Handlebars formatters

********************************************************************************
*/

function convertHexTo50(str)
{
	let v = parseInt(str, 16);
	if (v & 0x80000000) {
			v -= 0x100000000;
		}
	let vr = Math.round( ((v + 0x80000000) * 50) / 0x100000000);
	return vr;
}

function fixhex(v) {
	if(v === undefined) return v;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {

		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		ranged = Math.round( ((asInt + 0x80000000) * 50) / 0x100000000);
		if (v.length > 10) {
			ranged += '…';
		}
	}
	return ranged;
}

// scale 0x00000000 to 0x7FFFFFFF to 0-50
function fixpos50(v) {
	if(v === undefined) return undefined;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		ranged = Math.round( (asInt * 50) / 0x7FFFFFFF);
		if (v.length > 10) {
			ranged += '…';
		}
	}
	return ranged;
}


function fmtMidiCC(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;

	let res = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		// Midi CC params range from 0 to 127
		res = Math.round( (asInt + 0x80000000) * 127 / 0x100000000);
	}
	if (v.length > 10) {
		res += '…';
	}
	return res;
}


function fixpan(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	let ranged = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		let rangedm32to32 = Math.round( ((asInt + 0x80000000) * 64) / 0x100000000) - 32;
		if (rangedm32to32 === 0) ranged = 0;
		else if (rangedm32to32 < 0) ranged = Math.abs(rangedm32to32) + 'L';
		 else ranged = rangedm32to32 + 'R';
	}
	if (v.length > 10) {
		ranged += '…';
	}
	return ranged;
}

Handlebars.registerHelper('fixh', fixhex);
Handlebars.registerHelper('fixpan',fixpan);
Handlebars.registerHelper('fixpos50',fixpos50);
Handlebars.registerHelper('fmtMidiCC',fmtMidiCC);
// Vibrato (and other mod source scaling).
function fixm50to50(v) {
	if(v === undefined) return 0;
	if(typeof v !== "string") return v;
	let res = v;
	if (v.startsWith('0x')) {
		let asInt= parseInt(v.substring(2, 10), 16);
		// Convert to signed 32 bit.
		if (asInt & 0x80000000) {
			asInt -= 0x100000000;
		}
		// mod matrix weights range from 0xC0000000 to 0x3FFFFFF, and we want to show it
		// as -50 to 50
		res = Math.round( ((asInt + 0x80000000) * 200) / 0x100000000) - 100;
	}
	if (v.length > 10) {
		res += '…';
	}
	return res;
}


Handlebars.registerHelper('fixrev', function (v) {
	if (v === undefined) return v;
	let vn = Number(v);
	let ranged = Math.round( (vn * 50) / 0x7FFFFFFF);
	return ranged;
});


Handlebars.registerHelper('fixphase', function (v) {
	if (v === undefined) return v;
	let vn = Number(v);
	if (vn == -1) return 'off';
	// convert to unsigned 32 bits and divide by scaling factor.
	return Math.round((Number(vn) >>> 0) / 11930464);
});


Handlebars.registerHelper('fmtmoddest', function (tv) {
	if (tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn === 0) return 'carrier';
	if (tvn === 1) return 'mod 1';
	return 'Unknown';

});

Handlebars.registerHelper('fmttime', function (tv) {
	if(tv === undefined) return tv;
	let t = Number(tv) / 1000;
	let v = t.toFixed(3);
	return v;
});


Handlebars.registerHelper('fmtonoff', function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn > 0) return 'on';
	return 'off';
});


Handlebars.registerHelper('fmttransp', function (osc) {
	if(osc === undefined) return "";
	let amt = Number(osc.transpose) + Number(osc.cents) / 100;
	return amt.toFixed(2);
});

var priorityTab = ["low", "medium", "high"];

Handlebars.registerHelper('fmtprior', function (p) {
	if(p === undefined) return "";
	p = Number(p);
	if(p < 0 || p >= priorityTab.length) return '';
	return priorityTab[p];
});


var syncLevelTab = ["off", "4 bars", "2 bars", "1 bar", "2nd", "4th", "8th", "16th", "32nd", "64th"];

Handlebars.registerHelper('fmtsync', function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	return syncLevelTab[tvn];
});


Handlebars.registerHelper('shrinkifneeded', function (s) {
	if(s === undefined) return "";
	if (s.length <= 6) {
		return s;
	}
	return"<div class='textsm2'>" + s + "</div>";
});

var sidechain_release = [261528,38632, 19552, 13184, 9872, 7840, 6472, 5480, 4736, 4152, 3680, 3296, 2976,
2704, 2472, 2264, 2088, 1928, 1792, 1664, 1552, 1448, 1352, 1272, 1192, 1120, 1056, 992, 936, 880, 832,
784, 744, 704, 664, 624, 592, 560, 528, 496, 472, 448, 424, 400, 376, 352, 328, 312, 288, 272, 256];

var sidechain_attack = [1048576, 887876, 751804, 636588, 539028, 456420, 386472, 327244, 277092,
234624, 198668, 168220, 142440, 120612, 102128, 86476, 73224, 62000, 52500, 44452, 37640, 31872,
26988, 22852, 19348, 16384, 13876, 11748, 9948, 8428, 7132, 6040, 5112, 4328, 3668, 3104, 2628,
2224, 1884, 1596, 1352, 1144, 968, 820, 696, 558, 496, 420, 356, 304, 256];

function binaryIndexOf(tab,	seek) {
	if (seek === undefined) return undefined;
 
	var	minX = 0;
	var	maxX= tab.length - 1;
	var	curX;
	var	curItem;
 
	while (minX	<= maxX) {
		curX = (minX + maxX) / 2 | 0;
		curItem	= tab[curX];
 
		if (curItem	> seek)	{
			minX = curX	+ 1;
		}
		else if	(curItem < seek) {
			maxX = curX	- 1;
		}
		else {
			return curX;
		}
	}
	return maxX;
}

Handlebars.registerHelper('fmtscrelease', function (sv) {
	return binaryIndexOf(sidechain_release, sv);
	
});

Handlebars.registerHelper('fmtscattack', function (sv) {
	return binaryIndexOf(sidechain_attack, sv);
	
});


export {convertHexTo50, fixm50to50};