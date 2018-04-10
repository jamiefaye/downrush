import {jsonequals, xmlToJson, reviveClass, forceArray, nameToClassTab} from "./JsonXMLUtils.js";
import { observer, observable} from 'mobx';

class DRObject {

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

};

class Track extends DRObject {

};


class Song extends DRObject {

};

nameToClassTab.kit = Kit;
nameToClassTab.track = Track;
nameToClassTab.sound = Sound;
nameToClassTab.song = Song;
nameToClassTab.osc1 = Osc;
nameToClassTab.osc2 = Osc;

export {Kit, Track, Sound, Song};