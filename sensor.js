'use strict';

const bme280_sensor = require('bme280-sensor');

let Service, Characteristic;
var CommunityTypes;

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    CommunityTypes = require('hap-nodejs-community-types')(homebridge);

    homebridge.registerAccessory('homebridge-bme280', 'BME280', BME280Plugin);
};

class BME280Plugin {
    constructor(log, config) {
        this.log = log;
        this.name = config.name;
        this.name_temperature = config.name_temperature || this.name;
        this.name_humidity = config.name_humidity || this.name;
        this.options = config.options || {};

        this.init = false;
        this.data = {};
        if ('i2cBusNo' in this.options) this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
        if ('i2cAddress' in this.options) this.options.i2cAddress = parseInt(this.options.i2cAddress);
        this.log(`BME280 sensor options: ${JSON.stringify(this.options)}`);
        this.sensor = new bme280_sensor(this.options);
        this.sensor.init()
            .then(result => {
                this.log(`BME280 initialization succeeded`);
                this.init = true;
                this.readSensorData();
            })
            .catch(err => this.log(`BME280 initialization failed: ${err} `));

        this.temperatureService = new Service.TemperatureSensor(this.name_temperature);

        this.temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .on('get', this.getCurrentTemperature.bind(this));

        this.temperatureService
            .addCharacteristic(CommunityTypes.AtmosphericPressureLevel);

        this.humidityService = new Service.HumiditySensor(this.name_humidity);
//        this.humidityService
//            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
//            .on('get', this.getCurrentRelativeHumidity.bind(this));
    }

    // refresh sensor data
    readSensorData() {
        if (!this.init) return;
        this.sensor.readSensorData()
            .then(data => {
                this.log(`data = ${JSON.stringify(data, null, 2)}`);
                this.data = data;
            })
            .catch(err => this.log(`BME280 read error: ${err}`))
    }

    getCurrentTemperature(cb) {
        this.sensor.readSensorData()
            .then(data => {
                this.log(`data(temp) = ${JSON.stringify(data, null, 2)}`);
                this.temperatureService
                    .setCharacteristic(CommunityTypes.AtmosphericPressureLevel, roundInt(data.pressure_hPa));
                this.humidityService
                    .setCharacteristic(Characteristic.CurrentRelativeHumidity, roundInt(data.humidity));
                cb(null, roundInt(data.temperature_C));
            })
            .catch(err => {
                this.log(`BME read error: ${err}`);
                cb(err);
            });
    }


    getCurrentRelativeHumidity(cb) {
        this.sensor.readSensorData()
            .then(data => {
                this.log(`data(humi) = ${JSON.stringify(data, null, 2)}`);
                cb(null, data.humidity);
            })
            .catch(err => {
                this.log(`BME read error: ${err}`);
                cb(err);
            });
    }

    /* TODO
    getCurrentPressure(cb) {
      this.sensor.readSensorData()
        .then(data => {
          cb(null, data.pressure_hPA);
      })
      .catch(err => {
        console.log(`BME read error: ${err}`);
        cb(err);
      });
    }
    */

    getServices() {
        return [this.temperatureService, this.humidityService]
    }
}

function roundInt(string) {
    return Math.round(parseFloat(string)*10)/10;
}
