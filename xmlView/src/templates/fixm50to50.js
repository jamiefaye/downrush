module.exports = function(v) {
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

