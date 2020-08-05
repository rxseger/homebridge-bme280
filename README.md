# homebridge-bme680

EXPERIMENTAL fork from https://github.com/rxseger/homebridge-bme280 providing initial bme680 support for homebridge.

Uses 
* https://github.com/trho/bsec_bme680_linux (fork from https://github.com/alexh-name/bsec_bme680_linux with json output) which relies on the closed source BME680 driver by Bosch [BME680_driver](https://github.com/BoschSensortec/BME680_driver) to calculate IAQ (Indoor Air Quality)
* https://github.com/jorisvervuurt/jvsbme680
* The original IAQ value (0-500) is shown as a fake VOCDensity characteristic without available history

Tested with Pimoroni's BME680 breakout board (https://shop.pimoroni.com/collections/electronics/products/bme680) 

Limitations:
* Only supports storage "fs", yet
* i2c address is not configurable, yet 
* Since it is based on the [fakegato-history](https://github.com/simont77/fakegato-history) library the accessory only shows up in the Eve app and not in Apple Home.

Uses heuristic factor to convert between Bosch BSEC IAQ (Indoor Air Quality) and Eve Co2 ppm:

const FACTOR_BSEC_IAQ_EVE_PPM = (CO2_MAX_VALUE - PPM_OFFSET) / BSEC_IAQ_MAX;

Concrete values:
const FACTOR_BSEC_IAQ_EVE_PPM = (3000 - 450) / 500;

[Bosch BME680](https://www.bosch-sensortec.com/bst/products/all_products/bme680)
temperature/humidity/barometric pressure sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge).

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-bme280.svg?style=flat)](https://npmjs.org/package/homebridge-bme280)

* Display of temperature, humidity and Barometric Pressure from a BME280 connected to a RaspberryPI.
* Support the graphing feature of the Eve app for trends

Uses [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)

# Build Instructions

1. Init
npm install
2. Compile Typescript
npm compile

TODO

## Installation

Untested!

1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g trho/homebridge-bme680`
3.  Compile bsec_bme680 executable by following https://github.com/trho/bsec_bme680_linux 
4.  *Copy bsec_bme680 and bsec_iaq.config to homebridge storagePath (e.g. ~./homebridge)*
5.	Update your configuration file - see below for an example

Connect the BME680 chip to the I2C bus

## Configuration
* `accessory`: "BME680"
* `name`: descriptive name
* `name_temperature` (optional): descriptive name for the temperature sensor
* `name_humidity` (optional): descriptive name for the humidity sensor
* `name_air_quality` (optional): descriptive name for the air quality sensor
* `refresh`: Optional, time interval for refreshing data in seconds, defaults to 60 seconds.
* `options`: options for [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)
* `spreadsheetId` ( optional ): Log data to a google sheet, this is part of the URL of your spreadsheet.  ie the spreadsheet ID in the URL https://docs.google.com/spreadsheets/d/abc1234567/edit#gid=0 is "abc1234567". (TODO: not implemented, yet)


Example configuration:

```json
    "accessories": [
        {
            "accessory": "BME680",
            "name": "Sensor",
            "name_temperature": "Temperature",
            "name_humidity": "Humidity",
            "useBsecLib": true,
            "bsecTempCompensation": -0.35,
            "bsecHumidityCompensation": 4.0,
            "name_air_quality": "Air Quality",
            "useBsecLib": true
        }
    ]
```

The option "useBsecLib" only works if you placed compiled bsec_bme680 in homebridge storagePath.
By omitting this option this plugin relies on jvsbme680's sensor readings. In this case IAQ is just a dummy value.
There is an advantage using this simpler solution:
The temperature and humidity readings are much more precise in this case and no callibration & compensation is necessary in this case.
Once the compensation is this configurable I will elaborate this further.
For now see kvaruni's comment on callibration & compensation for gas readings:
https://forums.pimoroni.com/t/bme680-observed-gas-ohms-readings/6608/5


This plugin creates three services: TemperatureSensor, HumiditySensor and AirQualitySensor.

## Optional - Enable access to Google Sheets to log data

TODO: not implemented, yet

This presumes you already have a google account, and have access to google drive/sheets already

Step 1: Turn on the Drive API
a. Use this wizard ( https://console.developers.google.com/start/api?id=sheets.googleapis.com )
to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.

b. On the Add credentials to your project page, click the Cancel button.

c. At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.  I used 'Sheets Data Logger'

d. Select the Credentials tab, click the Create credentials button and select OAuth client ID.

e. Select the application type Other, enter the name "Drive API Quickstart", and click the Create button.

f. Click OK to dismiss the resulting dialog.

g. Click the file_download (Download JSON) button to the right of the client ID.

h. Move this file to your .homebridge and rename it logger_client_secret.json.

Step 2: Authorize your computer to access your Drive Account

a. Change to the directory where the plugin is installed i.e.

cd /usr/lib/node_modules/homebridge-mcuiot/node_modules/mcuiot-logger

b. Run the authorization module

node quickstart.js

c. Browse to the provided URL in your web browser.

If you are not already logged into your Google account, you will be prompted to log in. If you are logged into multiple Google accounts, you will be asked to select one account to use for the authorization.

d. Click the Accept button.

e. Copy the code you're given, paste it into the command-line prompt, and press Enter.

## See also

* [homebridge-ds18b20](https://www.npmjs.com/package/homebridge-ds18b20)
* [homebridge-dht-sensor](https://www.npmjs.com/package/homebridge-dht-sensor)
* [homebridge-dht](https://www.npmjs.com/package/homebridge-dht)
* [bsec_bme680_linux fork] https://github.com/trho/bsec_bme680_linux
* https://github.com/rxseger/homebridge-bme280
* https://github.com/jorisvervuurt/jvsbme680


## Credits
* 
* NorthernMan54 - Barometric Pressure and Device Polling
* simont77 - History Service
* alexh-name - C wrapper for BME680 sensor BSEC library
* jorisvervuurt - Node.js module for Pimoroni's BME680 Breakout

## License

MIT
