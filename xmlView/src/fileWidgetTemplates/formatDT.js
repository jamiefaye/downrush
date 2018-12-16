module.exports = function(f) {
	let seconds = (f.ftime & 31) * 2;
	let minutes = (f.ftime >> 5) & 63;
	let hours   = (f.ftime >> 11) & 31;
	let day   = f.fdate & 31;
	let month = (f.fdate >> 5) & 15;
	let year  = ((f.fdate >> 9) & 127) + 1980;
	if (year < 2000) return "";
	return "" + month + '/' + day + '&nbsp;' + zeroPad(hours,2) + ':' + zeroPad(minutes,2);
}
function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}