import {jsonequals, xmlToJson, reviveClass, forceArray, nameToClassTab, registerClass} from "./JsonXMLUtils.js";
import { observer, observable} from 'mobx';
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
	@observable fileName;
	@observable zone;
	@observable loopMode;
};


class Sound extends DRObject {
	@observable name;
};

class Kit extends DRObject {
	@observable.shallow soundSources;
};

class Track extends DRObject {

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

export {Kit, Track, Sound, Song};