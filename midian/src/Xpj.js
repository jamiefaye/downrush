// Data object for an XPJ.


class Xpj {
	constructor(xpjStr) {
		let xpjJson = JSON.parse(xpjStr);
		let xData = xpjJson.data;
		this.xpjJson = xData;
		this.tracks = xData.tracks;
		this.sequences = xData.sequences;
		this.sequence = this.sequences[0];
		this.nameToTrack = {};
		this.nameToColumn = {};
		this.columnToName = [];
		this.matrix = [];
		this.ingest();
		
	}

	ingest() {
		this.clips = [];
		
		this.minT = Number.MAX_SAFE_INTEGER;
		this.maxT = Number.MIN_SAFE_INTEGER;
		this.minN = Number.MAX_SAFE_INTEGER;
		this.maxN = Number.MIN_SAFE_INTEGER;

		let tracks = this.tracks;
		for(let tx = 0; tx < tracks.length; ++tx) {
			let t = tracks[tx];
			let n = t.name;
			this.nameToTrack[n] = t;
			this.nameToColumn[n] = tx;
			this.columnToName[tx] = n;
		}

		this.minRow = Number.MAX_SAFE_INTEGER;
		this.maxRow = Number.MIN_SAFE_INTEGER;
		this.minCol = Number.MAX_SAFE_INTEGER;
		this.maxCol = Number.MIN_SAFE_INTEGER;

		let trackArrays = this.sequence.value.trackClipMaps;
		for(let rowx = 0; rowx < trackArrays.length; ++rowx) {
			let rows = trackArrays[rowx];
			for (let colx = 0; colx < rows.length; ++colx) {
				let clip = rows[colx];
				let info = this.scanClip(clip);
				if (info) {
					info.row = rowx;
				//let nm = clip.
					let col = this.nameToColumn[clip.key];
					info.col = col;
					this.clips.push(info);
					if (info.row < this.minRow) this.minRow = info.row;
					if (info.col < this.minCol) this.minCol = info.col;
					if (info.row > this.maxRow) this.maxRow = info.row;
					if (info.col > this.maxCol) this.maxCol = info.col;

					if (!this.matrix[info.row]) this.matrix[info.row] = [];
					this.matrix[info.row][info.col] = info;
				}
			}
		}
	}
	// JSON.parse(text);

	scanClip(clip) {
		let events = clip.value.eventList.events;
		let nEvents = events.length;
		let minT = Number.MAX_SAFE_INTEGER;
		let maxT = Number.MIN_SAFE_INTEGER;
		let minN = Number.MAX_SAFE_INTEGER;
		let maxN = Number.MIN_SAFE_INTEGER;
		for(let i = 0; i < nEvents; ++i) {
			let ev = events[i];
			let evT = ev.time;
			var evET = evT;
			if (ev.note) {
				evET = evT + ev.note.length;
				let n = ev.note.note;
				if (n < minN) minN = n;
				if (n > maxN) maxN = n;
				if (evT < minT) minT = evT;
				if (evET > maxT) maxT = evET;
			}
		}

		if (minT === Number.MAX_SAFE_INTEGER || minN === Number.MAX_SAFE_INTEGER) return null;

		if (minT < this.minT) this.minT = minT;
		if (minN < this.minN) this.minN = minN;
		if (maxT > this.maxT) this.maxT = maxT;
		if (maxN > this.maxN) this.maxN = maxN;

		let clipInfo = {minT: minT, maxT: maxT, minN: minN, maxN: maxN,
						events: events, key: clip.key, clip: clip};

		return clipInfo;
	}
}

export {Xpj};