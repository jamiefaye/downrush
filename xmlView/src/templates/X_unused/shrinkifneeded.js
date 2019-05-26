module.exports = function (s) {
	if(s === undefined) return "";
	if (s.length <= 6) {
		return s;
	}
	return"<div class='textsm2'>" + s + "</div>";
}
