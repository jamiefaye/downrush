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

class SoundSources extends DRObject {
	@observable.shallow sound;
};

class Kit extends DRObject {

};

class Track extends DRObject {

};


class Song extends DRObject {

};

registerClass('kit', Kit);
registerClass('sound', Sound);
registerClass('kit', Song);
registerClass('osc1', Osc);
registerClass('osc2', Osc);
registerClass('soundSources', SoundSources);

export {Kit, Track, Sound, Song, SoundSources};