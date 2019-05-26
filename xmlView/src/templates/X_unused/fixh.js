module.exports = function(v) {
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