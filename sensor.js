'use strict';

//TODOconst bme280 = require('bme280-sensor');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-bme280', 'BME280', BME280);
};

class BME280
{
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    this.temperatureService = new Service.TemperatureSensor(this.name);

    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    this.humidityService = new Service.HumiditySensor(this.name);
    this.humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCurrentRelativeHumidity.bind(this));
  }

  getCurrentTemperature(cb) {
   cb(null, 33); // TODO
  }


  getCurrentRelativeHumidity(cb) {
   cb(null, 66); // TODO
  }

  getServices() {
    return [this.temperatureService, this.humidityService]
  }
}

