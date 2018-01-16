'use strict';

const bme280_sensor = require('bme280-sensor');
var debug = require('debug')('BME280');
var logger = require("mcuiot-logger").logger;
const moment = require('moment');
var os = require("os");
var hostname = os.hostname();

let Service, Characteristic;
var CustomCharacteristic;
var FakeGatoHistoryService;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  CustomCharacteristic = require('./lib/CustomCharacteristic.js')(homebridge);
  FakeGatoHistoryService = require('fakegato-history')(homebridge);

  homebridge.registerAccessory('homebridge-bme280', 'BME280', BME280Plugin);
};

class BME280Plugin {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.name_temperature = config.name_temperature || this.name;
    this.name_humidity = config.name_humidity || this.name;
    this.refresh = config['refresh'] || 60; // Update every minute
    this.options = config.options || {};
    this.spreadsheetId = config['spreadsheetId'];
    if (this.spreadsheetId) {
      this.log_event_counter = 59;
      this.logger = new logger(this.spreadsheetId);
    }

    this.init = false;
    this.data = {};
    if ('i2cBusNo' in this.options) this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
    if ('i2cAddress' in this.options) this.options.i2cAddress = parseInt(this.options.i2cAddress);
    this.log(`BME280 sensor options: ${JSON.stringify(this.options)}`);

    try {
      this.sensor = new bme280_sensor(this.options);
    } catch (ex) {
      this.log("BME280 initialization failed:", ex);
    }

    if (this.sensor)
      this.sensor.init()
      .then(result => {
        this.log(`BME280 initialization succeeded`);
        this.init = true;

        this.devicePolling.bind(this);
      })
      .catch(err => this.log(`BME280 initialization failed: ${err} `));


    this.informationService = new Service.AccessoryInformation();

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, "Bosch")
      .setCharacteristic(Characteristic.Model, "RPI-BME280")
      .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + hostname)
      .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);

    this.temperatureService = new Service.TemperatureSensor(this.name_temperature);

    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100
      });
    //        .on('get', this.getCurrentTemperature.bind(this));

    this.temperatureService
      .addCharacteristic(CustomCharacteristic.AtmosphericPressureLevel);

    this.humidityService = new Service.HumiditySensor(this.name_humidity);

    setInterval(this.devicePolling.bind(this), this.refresh * 1000);

    this.temperatureService.log = this.log;
    this.loggingService = new FakeGatoHistoryService("weather", this.temperatureService);

  }

  devicePolling() {
    debug("Polling BME280");
    if (this.sensor) {
      this.sensor.readSensorData()
        .then(data => {
          this.log(`data(temp) = ${JSON.stringify(data, null, 2)}`);

          this.loggingService.addEntry({
            time: moment().unix(),
            temp: roundInt(data.temperature_C),
            pressure: roundInt(data.pressure_hPa),
            humidity: roundInt(data.humidity)
          });

          if (this.spreadsheetId) {
            this.log_event_counter = this.log_event_counter + 1;
            if (this.log_event_counter > 59) {
              this.logger.storeBME(this.name, 0, roundInt(data.temperature_C), roundInt(data.humidity), roundInt(data.pressure_hPa));
              this.log_event_counter = 0;
            }
          }
          this.temperatureService
            .setCharacteristic(Characteristic.CurrentTemperature, roundInt(data.temperature_C));
          this.temperatureService
            .setCharacteristic(CustomCharacteristic.AtmosphericPressureLevel, roundInt(data.pressure_hPa));
          this.humidityService
            .setCharacteristic(Characteristic.CurrentRelativeHumidity, roundInt(data.humidity));

        })
        .catch(err => {
          this.log(`BME read error: ${err}`);
          debug(err.stack);
          if (this.spreadsheetId) {
            this.logger.storeBME(this.name, 1, -999, -999, -999);
          }

        });
    } else {
      this.log("Error: BME280 Not Initalized");
    }
  }

  getServices() {
    return [this.informationService, this.temperatureService, this.humidityService, this.loggingService]
  }
}

function roundInt(string) {
  return Math.round(parseFloat(string) * 10) / 10;
}
