// scale 0x00000000 to 0x7FFFFFFF to 0-50
module.exports = function(v) {
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