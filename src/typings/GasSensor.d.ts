// Type definitions for lib/GasSensor.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * `GasSensor` class.
 * An instance of this class can be accessed via `bme680.gasSensor`.
 * 
 * @class GasSensor
 */
declare interface GasSensor {
		
	/**
	 * 
	 * @param bme680 
	 */
	new (bme680 : any);
		
	/**
	 * Enables the gas sensor.
	 * 
	 * @returns {Promise} A promise that is resolved when the gas sensor has been enabled successfully.
	 * @memberof GasSensor
	 * @return  
	 */
	enable(): Promise<void>;
		
	/**
	 * Disables the gas sensor.
	 * 
	 * @returns {Promise} A promise that is resolved when the gas sensor has been disabled successfully.
	 * @memberof GasSensor
	 * @return  
	 */
	disable(): Promise<void>;
		
	/**
	 * Sets the heater temperature.
	 * 
	 * @param {number} heaterTemperature The heater temperature (between 200 and 400 degrees Celsius).
	 * @returns {Promise} A promise that is resolved when the heater temperature has been set successfully.
	 * @memberof GasSensor
	 * @param heaterTemperature 
	 * @return  
	 */
	setHeaterTemperature(heaterTemperature : number): Promise<void>;
		
	/**
	 * Sets the heater duration.
	 * 
	 * @param {number} heaterDuration The heater duration (between 1 and 4032 milliseconds).
	 * @returns {Promise} A promise that is resolved when the heater duration has been set successfully.
	 * @memberof GasSensor
	 * @param heaterDuration 
	 * @return  
	 */
	setHeaterDuration(heaterDuration : number): Promise<void>;
		
	/**
	 * Reads the sensor value.
	 * 
	 * @returns {Promise} A promise that is resolved with the gas resistance (Ohms).
	 * @memberof GasSensor
	 * @return  
	 */
	read(): Promise<GasResult>;
}

export interface GasResult {
	// TODO	
}