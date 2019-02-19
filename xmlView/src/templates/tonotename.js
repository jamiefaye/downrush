const {yToNoteName} =  require("../SongViewLib.js");

module.exports = function (y) {
	let nn = yToNoteName(y);
	if (!nn) return "";
	return nn;
}
