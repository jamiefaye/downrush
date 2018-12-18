import {registerClass} from "./JsonXMLUtils.js";
import shortid from 'shortid';

class DRObject {
	constructor(o) {
		if(o) {
			Object.assign(this, o);
		}
		this.uniqueId = shortid.generate();
	}
};

class Osc extends DRObject {

};


class Sound extends DRObject {

};

class Kit extends DRObject {

};

class CVChannel extends DRObject {

};

class MidiChannel extends DRObject {

};


class Song extends DRObject {

};

class MidiOutput extends DRObject {

};

registerClass('kit', Kit);
registerClass('sound', Sound);
// registerClass('kit', Song);
registerClass('osc1', Osc);
registerClass('osc2', Osc);
registerClass('midiOutput', MidiOutput);
registerClass('cvChannel', CVChannel);
registerClass('midiChannel', MidiChannel);

export {Kit, Sound, Song, MidiChannel, CVChannel};