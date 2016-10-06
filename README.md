# homebridge-bme280

[Bosch BME280](https://www.bosch-sensortec.com/bst/products/all_products/bme280) temperature/humidity sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge)

Uses [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)

## Installation
1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g homebridge-bme280`
3.	Update your configuration file - see below for an example

Connect the BME280 chip to the I2C bus

## Configuration
* `accessory`: "BME280"
* `name`: descriptive name
* `options`: options for [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)

If you get an I/O error, make sure the I2C address is correct (usually 0x76 or 0x77 depending on a jumper).

Example configuration:

```json
    "accessories": [
        {
            "accessory": "BME280",
            "name": "Sensor",
            "options": {
              "i2cBusNo": 1,
              "i2cAddress": "0x76"
            }
        }
    ]
```

This plugin creates two services: TemperatureSensor and HumiditySensor.

## See also

* [homebridge-ds18b20](https://www.npmjs.com/package/homebridge-ds18b20)
* [homebridge-dht-sensor](https://www.npmjs.com/package/homebridge-dht-sensor)
* [homebridge-dht](https://www.npmjs.com/package/homebridge-dht)

## License

MIT

