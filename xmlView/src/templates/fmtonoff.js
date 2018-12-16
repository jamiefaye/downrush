module.exports = function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	if (tvn > 0) return 'on';
	return 'off';
}
