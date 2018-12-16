module.exports = function (tv) {
	if (tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn === 0) return 'carrier';
	if (tvn === 1) return 'mod 1';
	return 'Unknown';

}
