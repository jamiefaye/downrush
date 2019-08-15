module.exports = function(v) {
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
