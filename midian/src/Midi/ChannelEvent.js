import { Header } from './Header'

const privateHeaderMap = new Map()

/**
 * @typedef ChannelEvent
 * @property {number} controllerType
 * @property {number=} value
 * @property {number=} absoluteTime
 */

/**
  * Represents a channel event (such as pitchbend, aftertouch, etc.
  */
export class ChannelEvent {
	/**
	 * @param {ControlChangeEvent} event
	 * @param {Header} header
	 */
	constructor(event, header){
		privateHeaderMap.set(this, header)

		/** @type {number} */
		this.type = event.type;
		/** @type {number} */
		this.value = event.value

		this.ticks = event.absoluteTime;
		this.amount = event.amount;
		this.noteNumber = event.noteNumber;
		this.programNumber = event.programNumber;
	}

	/**
	 * The time of the event in seconds
	 * @type {number}
	 */
	get time(){
		const header = privateHeaderMap.get(this)
		return header.ticksToSeconds(this.ticks)
	}

	set time(t){
		const header = privateHeaderMap.get(this)
		this.ticks = header.secondsToTicks(t)
	}

	toJSON(){
		let json = {type: type };
		json.value = this.value;
		json.ticks = this.ticks;
		json.amount = this.amount;
		json.noteNumber = this.noteNumber;
		json.programNumber = this.programNumber;
		return json;
	}
}
