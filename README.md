# homebridge-bme680

EXPERIMENTAL fork from https://github.com/rxseger/homebridge-bme280 offering initial bme680 support for homebridge.

Uses 
* https://github.com/trho/bsec_bme680_linux (fork from https://github.com/alexh-name/bsec_bme680_linux with json output) which relies on the closed source BME680 driver by Bosch [BME680_driver](https://github.com/BoschSensortec/BME680_driver) to calculate IAQ (Indoor Air Quality)
* https://github.com/jorisvervuurt/jvsbme680
* The original IAQ value (0-500) is shown as a fake VOCDensity characteristic without available history

Limitations:
* Only supports storage "fs" right now
* Only uses eve fake history service (https://github.com/simont77/fakegato-history): accessory does not show up in Home app, only in Eve app

Uses heuristic factor to convert between Bosch BSEC IAQ (Indoor Air Quality) and Eve Co2 ppm:

const FACTOR_BSEC_IAQ_EVE_PPM = (CO2_MAX_VALUE - PPM_OFFSET) / BSEC_IAQ_MAX;

Concrete values:
const FACTOR_BSEC_IAQ_EVE_PPM = (3000 - 450) / 500;

[Bosch BME680](https://www.bosch-sensortec.com/bst/products/all_products/bme680)
temperature/humidity/barometric pressure sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge).

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-bme280.svg?style=flat)](https://npmjs.org/package/homebridge-bme280)

* Display of temperature, humidity and Barometric Pressure from a BME280 connected to a RaspberryPI.
* Archives results every hour to a google spreadsheet
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
4.  *Copy bsec_bme680 to global node_modules/homebridge-bme680/lib*
5.  *Copy bsec_iaq.config to homebridge storagePath (e.g. ~./homebridge)*
4.	Update your configuration file - see below for an example

Connect the BME680 chip to the I2C bus

## Configuration
* `accessory`: "BME680"
* `name`: descriptive name
* `name_temperature` (optional): descriptive name for the temperature sensor
* `name_humidity` (optional): descriptive name for the humidity sensor
* `refresh`: Optional, time interval for refreshing data in seconds, defaults to 60 seconds.
* `options`: options for [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)
* `spreadsheetId` ( optional ): Log data to a google sheet, this is part of the URL of your spreadsheet.  ie the spreadsheet ID in the URL https://docs.google.com/spreadsheets/d/abc1234567/edit#gid=0 is "abc1234567". (TODO: not implemented, yet)

If you get an I/O error, make sure the I2C address is correct (usually 0x76 or 0x77 depending on a jumper).

Example configuration:

```json
    "accessories": [
        {
            "accessory": "BME680",
            "name": "Sensor",
            "name_temperature": "Temperature",
            "name_humidity": "Humidity",
            "name_air_quality": "Air Quality",
            "options": {
              "i2cBusNo": 1,
              "i2cAddress": "0x76"
            }
        }
    ]
```

This plugin creates two services: TemperatureSensor and HumiditySensor.

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
* NorthernMan54 - Barometric Pressure and Device Polling
* simont77 - History Service

## License

MIT
