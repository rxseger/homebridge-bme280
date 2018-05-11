// Type definitions for lib/BME680.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * `BME680` class.
 * 
 * @class BME680
 * @extends {EventEmitter}
 */
declare interface BME680 {
		
	/**
	 * 
	 * @param i2cAddress? 
	 */
	new (i2cAddress? : string);
		
	/**
	 * Sets the IIR filter size (see `Constants.FilterSize` for valid values).
	 * 
	 * @param {number} filterSize The filter size.
	 * @returns {Promise} A promise that is resolved when the filter size has been set successfully.
	 * @memberof BME680
	 * @param filterSize 
	 * @return  
	 */
	setFilterSize(filterSize : number): Promise<void>;
		
	/**
	 * Reads the sensor data.
	 * 
	 * @param {boolean} [requireHeatStable=true] A value that indicates whether heat should be stable before reading the sensor data.
	 * @returns {Promise} A promise that is resolved with an object containing the sensor data.
	 * @memberof BME680
	 * @param requireHeatStable? 
	 * @return  
	 */
	read(requireHeatStable? : boolean): Promise<BME680Result>;
		
	/**
	 * Performs a soft reset.
	 * 
	 * @returns {Promise} A promise that is resolved when the soft reset has been performed successfully.
	 * @memberof BME680
	 * @return  
	 */
	reset(): Promise<void>;
		
	/**
	 * Kills the Python process.
	 * 
	 * @param {boolean} [performReset=false] A value that indicates whether a soft reset should be performed.
	 * @returns {Promise} A promise that is resolved when the Python process has been killed successfully.
	 * @memberof BME680
	 * @param performReset? 
	 * @return  
	 */
	kill(performReset? : boolean): Promise<void>;
		
	/**
	 * Sends a command to the Python process.
	 * 
	 * @private
	 * @param {string} component The component.
	 * @param {string} command The command.
	 * @param {object} [parameters={}] The parameters (optional).
	 * @returns {Promise} A promise that is resolved with the response data (if available) when the command has finished successfully.
	 * @memberof BME680
	 * @param component 
	 * @param command 
	 * @param parameters? 
	 * @return  
	 */
	_sendCommand(component : string, command : string, parameters? : any): any;
		
	/**
	 * Spawns a new Python process (if none is currently running).
	 * 
	 * @private
	 * @memberof BME680
	 */
	_spawnPythonProcess(): void;
		
	/**
	 * Cleanup after the Python process has exited.
	 * 
	 * @private
	 * @memberof BME680
	 */
	_cleanup(): void;
}


declare interface BME680Result {
	temperature:number;
	pressure:number;
	humidity:number;
	gasResistance:number;
}