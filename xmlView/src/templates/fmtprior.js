var priorityTab = ["low", "medium", "high"];

module.exports = function (p) {
	if(p === undefined) return "";
	p = Number(p);
	if(p < 0 || p >= priorityTab.length) return '';
	return priorityTab[p];
}
