module.exports = function (v) {
	if (v === undefined) return v;
	let vn = Number(v);
	if (vn == -1) return 'off';
	// convert to unsigned 32 bits and divide by scaling factor.
	return Math.round((Number(vn) >>> 0) / 11930464);
}