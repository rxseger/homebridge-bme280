# homebridge-am2320

[ASONG AM2320](https://akizukidenshi.com/download/ds/aosong/AM2320.pdf) temperature/humidity sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge)

## Installation
1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g homebridge-thermometer-am2320`
3.	Update your configuration file - see below for an example

Connect the AM2320 chip to the I2C bus

## Configuration
* `accessory`: "AM2320"
* `name`: descriptive name
* `name_temperature` (optional): descriptive name for the temperature sensor
* `name_humidity` (optional): descriptive name for the humidity sensor

If you get an I/O error, make sure the I2C address is correct (usually 0x5c depending on a jumper).

Example configuration:

```json
    "accessories": [
        {
            "accessory": "AM2320",
            "name": "Sensor",
            "name_temperature": "Temperature",
            "name_humidity": "Humidity",
            "options": {
              "i2cBusNo": 1,
              "i2cAddress": "0x5c"
            }
        }
    ]
```

This plugin creates two services: TemperatureSensor and HumiditySensor.

## License

MIT

