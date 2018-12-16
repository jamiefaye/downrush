var sidechain_release = [261528,38632, 19552, 13184, 9872, 7840, 6472, 5480, 4736, 4152, 3680, 3296, 2976,
2704, 2472, 2264, 2088, 1928, 1792, 1664, 1552, 1448, 1352, 1272, 1192, 1120, 1056, 992, 936, 880, 832,
784, 744, 704, 664, 624, 592, 560, 528, 496, 472, 448, 424, 400, 376, 352, 328, 312, 288, 272, 256];

module.exports = function (sv) {
	if (sv === undefined) return undefined;

	var	minX = 0;
	var	maxX= tab.length - 1;
	var	curX;
	var	curItem;

	while (minX	<= maxX) {
		curX = (minX + maxX) / 2 | 0;
		curItem	= sidechain_release[curX];
 
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