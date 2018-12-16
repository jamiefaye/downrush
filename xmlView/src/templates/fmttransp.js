module.exports = function (osc) {
	if(osc === undefined) return "";
	let amt = Number(osc.transpose) + Number(osc.cents) / 100;
	return amt.toFixed(2);
}