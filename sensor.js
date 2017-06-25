'use strict';

const bme280_sensor = require('bme280-sensor');

let Service, Characteristic;
var CommunityTypes;
var debug = require('debug')('BME280');
var logger = require("mcuiot-logger").logger;

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
        this.refresh = config['refresh'] || 60; // Update every minute
        this.options = config.options || {};
        this.spreadsheetId = config['spreadsheetId'];
        if (this.spreadsheetId) {
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

                this.temperatureService
                    .getCharacteristic(Characteristic.CurrentTemperature).getValue();
            })
            .catch(err => this.log(`BME280 initialization failed: ${err} `));


        this.informationService = new Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, "Bosch")
            .setCharacteristic(Characteristic.Model, "RPI-BME280")
            .setCharacteristic(Characteristic.SerialNumber, this.device);

        this.temperatureService = new Service.TemperatureSensor(this.name_temperature);

        this.temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                minValue: -100,
                maxValue: 100
            })
            .on('get', this.getCurrentTemperature.bind(this));

        this.temperatureService
            .addCharacteristic(CommunityTypes.AtmosphericPressureLevel);

        this.humidityService = new Service.HumiditySensor(this.name_humidity);

        setInterval(this.devicePolling.bind(this), this.refresh * 1000);

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
        if (this.sensor) {
            this.sensor.readSensorData()
                .then(data => {
                    this.log(`data(temp) = ${JSON.stringify(data, null, 2)}`);
                    if (this.spreadsheetId) {
                        debug("Data",data);
                        this.logger.storeBME(this.name,0,roundInt(data.temperature_C),roundInt(data.humidity),roundInt(data.pressure_hPa));
                    }
                    this.temperatureService
                        .setCharacteristic(CommunityTypes.AtmosphericPressureLevel, roundInt(data.pressure_hPa));
                    this.humidityService
                        .setCharacteristic(Characteristic.CurrentRelativeHumidity, roundInt(data.humidity));
                    cb(null, roundInt(data.temperature_C));
                })
                .catch(err => {
                    this.log(`BME read error: ${err}`);
                    if (this.spreadsheetId) {
                        this.logger.storeBME(this.name,1,-999,-999,-999);
                    }
                    cb(err);
                });
        } else {
            this.log("Error: BME280 Not Initalized");
            cb(new Error("BME280 Not Initalized"));
        }

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

    devicePolling() {
            debug("Polling BME280");
        this.temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature).getValue();
    }

    getServices() {
        return [this.informationService, this.temperatureService, this.humidityService]
    }
}

function roundInt(string) {
    return Math.round(parseFloat(string) * 10) / 10;
}
