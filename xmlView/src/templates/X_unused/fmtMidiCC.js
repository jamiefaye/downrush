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
		// Midi CC params range from 0 to 127
		res = Math.round( (asInt + 0x80000000) * 127 / 0x100000000);
	}
	if (v.length > 10) {
		res += '…';
	}
	return res;
}
