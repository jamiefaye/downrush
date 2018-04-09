import {jsonequals, xmlToJson, reviveClass, forceArray, nameToClassTab} from "./JsonXMLUtils.js";


class DRObject {

};


class Sound extends DRObject {

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

export {Kit, Track, Sound, Song};