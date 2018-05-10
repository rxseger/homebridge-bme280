// Type definitions for lib/Constants.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 * `Constants` class.
 * 
 * @class Constants
 */
declare interface Constants {
		
	/**
	 * 
	 * @return  
	 */
	new (): Constants;
}


/**
 * 
 */
declare namespace Constants{
	
	/**
	 * 
	 */
	namespace I2CAddress{
				
		/**
		 * 
		 */
		export var I2CA_PRIMARY : string;
				
		/**
		 * 
		 */
		export var I2CA_SECONDARY : string;
				
		/**
		 * 
		 * @param val 
		 * @return  
		 */
		function hasValue(val : any): boolean;
	}
	
	/**
	 * 
	 */
	namespace OversamplingRate{
				
		/**
		 * 
		 */
		export var OSR_0X : number;
				
		/**
		 * 
		 */
		export var OSR_1X : number;
				
		/**
		 * 
		 */
		export var OSR_2X : number;
				
		/**
		 * 
		 */
		export var OSR_4X : number;
				
		/**
		 * 
		 */
		export var OSR_8X : number;
				
		/**
		 * 
		 */
		export var OSR_16X : number;
				
		/**
		 * 
		 * @param val 
		 * @return  
		 */
		function hasValue(val : any): boolean;
	}
	
	/**
	 * 
	 */
	namespace FilterSize{
				
		/**
		 * 
		 */
		export var FS_0 : number;
				
		/**
		 * 
		 */
		export var FS_1 : number;
				
		/**
		 * 
		 */
		export var FS_3 : number;
				
		/**
		 * 
		 */
		export var FS_7 : number;
				
		/**
		 * 
		 */
		export var FS_15 : number;
				
		/**
		 * 
		 */
		export var FS_31 : number;
				
		/**
		 * 
		 */
		export var FS_63 : number;
				
		/**
		 * 
		 */
		export var FS_127 : number;
				
		/**
		 * 
		 * @param val 
		 * @return  
		 */
		function hasValue(val : any): boolean;
	}
		
	/**
	 * 
	 * @param obj 
	 * @param val 
	 * @return  
	 */
	function _hasValue(obj : any, val : any): boolean;
}
