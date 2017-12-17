# homebridge-bme280

[Bosch BME280](https://www.bosch-sensortec.com/bst/products/all_products/bme280)
temperature/humidity/barometric pressure sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge).

[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-bme280.svg?style=flat)](https://npmjs.org/package/homebridge-bme280)

* Display of temperature, humidity and Barometric Pressure from a BME280 connected to a RaspberryPI.
* Archives results every hour to a google spreadsheet
* Support the graphing feature of the Eve app for trends

Uses [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)

# Build Instructions

Detailed build instructions are available here. https://www.instructables.com/id/Connect-Your-RaspberryPI-to-the-BME280-Temperature/

## Installation
1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g homebridge-bme280`
3.	Update your configuration file - see below for an example

Connect the BME280 chip to the I2C bus

## Configuration
* `accessory`: "BME280"
* `name`: descriptive name
* `name_temperature` (optional): descriptive name for the temperature sensor
* `name_humidity` (optional): descriptive name for the humidity sensor
* `refresh`: Optional, time interval for refreshing data in seconds, defaults to 60 seconds.
* `options`: options for [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)
* `spreadsheetId` ( optional ): Log data to a google sheet, this is part of the URL of your spreadsheet.  ie the spreadsheet ID in the URL https://docs.google.com/spreadsheets/d/abc1234567/edit#gid=0 is "abc1234567".

If you get an I/O error, make sure the I2C address is correct (usually 0x76 or 0x77 depending on a jumper).

Example configuration:

```json
    "accessories": [
        {
            "accessory": "BME280",
            "name": "Sensor",
            "name_temperature": "Temperature",
            "name_humidity": "Humidity",
            "options": {
              "i2cBusNo": 1,
              "i2cAddress": "0x76"
            }
        }
    ]
```

This plugin creates two services: TemperatureSensor and HumiditySensor.

## Optional - Enable access to Google Sheets to log data

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

## Credits
* NorthernMan54 - Barometric Pressure and Device Polling
* simont77 - History Service

## License

MIT
