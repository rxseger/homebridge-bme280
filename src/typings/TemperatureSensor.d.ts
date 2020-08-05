// Type definitions for lib/TemperatureSensor.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * `TemperatureSensor` class.
 *  An instance of this class can be accessed via `bme680.temperatureSensor`.
 * 
 * @class TemperatureSensor
 */
declare interface TemperatureSensor {
		
	/**
	 * 
	 * @param bme680 
	 */
	new (bme680 : any);
		
	/**
	 * Sets the oversampling rate (see `Constants.OversamplingRate` for valid values).
	 * 
	 * @param {number} oversamplingRate The oversampling rate.
	 * @returns {Promise} A promise that is resolved when the oversampling rate has been set successfully.
	 * @memberof TemperatureSensor
	 * @param oversamplingRate 
	 * @return  
	 */
	setOversamplingRate(oversamplingRate : number): Promise<void>;
		
	/**
	 * Reads the sensor value.
	 * 
	 * @returns {Promise} A promise that is resolved with the temperature (degrees C).
	 * @memberof TemperatureSensor
	 * @return  
	 */
	read(): Promise<TemperatureResult>;
}

export interface TemperatureResult {
	// TODO
}
