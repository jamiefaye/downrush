var syncLevelTab = ["off", "4 bars", "2 bars", "1 bar", "2nd", "4th", "8th", "16th", "32nd", "64th"];

module.exports = function (tv) {
	if(tv === undefined) return "";
	let tvn = Number(tv);
	return syncLevelTab[tvn];
}
