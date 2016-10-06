# homebridge-bme280

BME280 temperature/humidity sensor service plugin for [Homebridge](https://github.com/nfarina/homebridge)

Uses [bme280-sensor](https://www.npmjs.com/package/bme280-sensor)

## Installation
1.	Install Homebridge using `npm install -g homebridge`
2.	Install this plugin `npm install -g homebridge-bme280`
3.	Update your configuration file - see below for an example

Connect the BME280 chip to the I2C bus

## Configuration
* `accessory`: "BME280"
* `name`: descriptive name

Example configuration:

```json
    "accessories": [
        {
            "accessory": "BME280",
            "name": "Sensor"
        }
    ]
```

## See also

* [homebridge-ds18b20](https://www.npmjs.com/package/homebridge-ds18b20)
* [homebridge-dht-sensor](https://www.npmjs.com/package/homebridge-dht-sensor)
* [homebridge-dht](https://www.npmjs.com/package/homebridge-dht)

## License

MIT

