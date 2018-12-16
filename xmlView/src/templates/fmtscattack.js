var sidechain_attack = [1048576, 887876, 751804, 636588, 539028, 456420, 386472, 327244, 277092,
234624, 198668, 168220, 142440, 120612, 102128, 86476, 73224, 62000, 52500, 44452, 37640, 31872,
26988, 22852, 19348, 16384, 13876, 11748, 9948, 8428, 7132, 6040, 5112, 4328, 3668, 3104, 2628,
2224, 1884, 1596, 1352, 1144, 968, 820, 696, 558, 496, 420, 356, 304, 256];

module.exports = function (sv) {
	if (sv === undefined) return undefined;

	var	minX = 0;
	var	maxX= tab.length - 1;
	var	curX;
	var	curItem;
 
	while (minX	<= maxX) {
		curX = (minX + maxX) / 2 | 0;
		curItem	= sidechain_attack[curX];

		if (curItem	> sv)	{
			minX = curX	+ 1;
		}
		else if	(curItem < sv) {
			maxX = curX	- 1;
		}
		else {
			return curX;
		}
	}
	return maxX;
}