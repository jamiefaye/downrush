// Simple Player that can share a buffer with a WaveView or a AudioView.

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class TinyPlayer {
	constructor(noteDone) {
		this.noteDone = noteDone;
		this.ended = this.ended.bind(this);
		this.playing = false;
	}

	ended() {
		this.playing = false;
		this.noteDone();
	}

	isPlaying() {
		return this.playing;
	}

	setBlob(blob, ready) {
		let me = this;
		if(this.blob === blob) {
			ready(this);
		}
		this.blob = blob;
		
		let fileReader = new FileReader();
		let arrayBuffer;

		fileReader.onloadend = () => {
			arrayBuffer = fileReader.result;
			audioCtx.decodeAudioData(arrayBuffer, function(buffer) {
				me.buffer = buffer;
				ready(me);
			});
		};
		fileReader.readAsArrayBuffer(blob);
	}

  stop() {
	if(this.playing) {
		this.source.stop();
	}
  }

  play(startT, endT) {
	this.source = audioCtx.createBufferSource(); // creates a sound source
	this.source.buffer = this.buffer;
	this.source.connect(audioCtx.destination);
	this.source.onended = this.ended;
	this.playing = true;
	this.source.start(0, startT, endT - startT);
  }
};

export {TinyPlayer};
