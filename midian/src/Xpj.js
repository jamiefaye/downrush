// Data object for an XPJ.


class Xpj {
	constructor(xpjStr) {
		let xpjJson = JSON.parse(xpjStr);
		let xData = xpjJson.data;
		this.xpjJson = xData;
		this.tracks = xData.tracks;
		this.sequences = xData.sequences;
		this.sequence = this.sequences[0];

		//this.xpjText = JSON.stringify(this.xjson, undefined, 2);
		//console.log(this.xpjText);
		
	}
	// JSON.parse(text);
}

export {Xpj};