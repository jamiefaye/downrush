module.exports = function(str)
{
	let v = parseInt(str, 16);
	if (v & 0x80000000) {
			v -= 0x100000000;
		}
	let vr = Math.round( ((v + 0x80000000) * 50) / 0x100000000);
	return vr;
}
