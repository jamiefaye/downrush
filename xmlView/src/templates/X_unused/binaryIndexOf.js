module.exports = function (tab,	seek) {
	if (seek === undefined) return undefined;
 
	var	minX = 0;
	var	maxX= tab.length - 1;
	var	curX;
	var	curItem;
 
	while (minX	<= maxX) {
		curX = (minX + maxX) / 2 | 0;
		curItem	= tab[curX];
 
		if (curItem	> seek)	{
			minX = curX	+ 1;
		}
		else if	(curItem < seek) {
			maxX = curX	- 1;
		}
		else {
			return curX;
		}
	}
	return maxX;
}
