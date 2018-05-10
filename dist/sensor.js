(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./CustomCharacteristic", "child_process", "util"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    const CustomCharacteristic_1 = require("./CustomCharacteristic");
    const child_process_1 = require("child_process");
    const util_1 = require("util");
    const path = require('path');
    //const bme280_sensor = require('bme280-sensor');
    //var debug = require('debug')('BME280');
    const bme680_sensor = require('jvsbme680');
    var logger = require("mcuiot-logger").logger;
    const moment = require('moment');
    var os = require("os");
    var hostname = os.hostname();
    let Service;
    let Characteristic;
    var CustomCharacteristic;
    var FakeGatoHistoryService;
    let EveAirQualityPpmCharacteristic;
    let EveAirQualityUnknownCharacteristic;
    const REFRESH_TIME_IN_MINUTES = 5;
    const CO2_MAX_VALUE = 3000; // I am assuming that iaq 500 ~ 3000 ppm
    const BSEC_IAQ_MAX = 500;
    const PPM_OFFSET = 450;
    let homebridgeRef;
    // Heuristic factor to convert between Bosch BSEC IAQ (Indoor Air Quality) and Eve Co2 ppm.
    const FACTOR_BSEC_IAQ_EVE_PPM = (CO2_MAX_VALUE - PPM_OFFSET) / BSEC_IAQ_MAX;
    module.exports = (homebridge) => {
        homebridgeRef = homebridge;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
        CustomCharacteristic = CustomCharacteristic_1.initCustomCharacteristic(homebridge);
        FakeGatoHistoryService = require('fakegato-history')(homebridge);
        homebridge.registerAccessory('homebridge-bme680', 'BME680', BME680Plugin);
        // see https://github.com/skrollme/homebridge-eveatmo/issues/1
        EveAirQualityPpmCharacteristic = function () {
            Characteristic.call(this, 'Air Quality in ppm', 'E863F10B-079E-48FF-8F27-9C2605A29F52');
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                maxValue: CO2_MAX_VALUE,
                minValue: 450,
                minStep: 1,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        util_1.inherits(EveAirQualityPpmCharacteristic, Characteristic);
        EveAirQualityPpmCharacteristic.UUID = 'E863F10B-079E-48FF-8F27-9C2605A29F52';
        EveAirQualityUnknownCharacteristic = function () {
            Characteristic.call(this, 'Air Quality in ppm', 'E863F132-079E-48FF-8F27-9C2605A29F52');
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                maxValue: CO2_MAX_VALUE,
                minValue: 450,
                minStep: 1,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        util_1.inherits(EveAirQualityUnknownCharacteristic, Characteristic);
        EveAirQualityUnknownCharacteristic.UUID = 'E863F132-079E-48FF-8F27-9C2605A29F52';
    };
    class BME680Plugin {
        constructor(log, config) {
            this.log = log;
            this.polling = false;
            this.log = log;
            this.name = config.name;
            this.name_temperature = config.name_temperature || this.name;
            this.name_humidity = config.name_humidity || this.name;
            this.name_air_quality = config.name_air_quality || this.name;
            this.log("temp & hum names: " +
                this.name_temperature + "," +
                this.name_humidity);
            this.refresh = config['refresh'] || REFRESH_TIME_IN_MINUTES * 60;
            this.options = config.options || {};
            this.spreadsheetId = config['spreadsheetId'];
            if (this.spreadsheetId) {
                this.log_event_counter = 59;
                this.logger = new logger(this.spreadsheetId);
            }
            if ('i2cBusNo' in this.options)
                this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
            if ('i2cAddress' in this.options)
                this.options.i2cAddress = parseInt(this.options.i2cAddress);
            this.log(`bme680 sensor options: ${JSON.stringify(this.options)}`);
            try {
                // Creates an instance of `BME680`.
                // uses default i2c address  [i2cAddress='0x76'] See I2C address (see `Constants.I2CAddress` for valid values)
                // Constants.I2CAddress.I2CA_PRIMARY
                this.log("init bme680 sensor ...");
                // TODO: consider this.options.i2cAddress
                this.sensor = new bme680_sensor.BME680();
                this.log("initialized bme680 sensor");
            }
            catch (ex) {
                this.log("bme680 initialization failed:", ex);
            }
            this.devicePolling.bind(this);
            this.informationService = new Service.AccessoryInformation(undefined, undefined, undefined);
            this.informationService
                .setCharacteristic(Characteristic.Manufacturer, "Bosch")
                .setCharacteristic(Characteristic.Model, "RPI-BME680")
                .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + hostname)
                .setCharacteristic(Characteristic.FirmwareRevision, require('./../package.json').version);
            this.temperatureService = new Service.TemperatureSensor(this.name_temperature, /*TRHO*/ undefined, undefined);
            this.temperatureService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .setProps({
                minValue: -100,
                maxValue: 100
            });
            this.temperatureService
                .addCharacteristic(CustomCharacteristic.AtmosphericPressureLevel);
            this.humidityService = new Service.HumiditySensor(this.name_humidity, undefined, undefined);
            this.airQualitySensor = new Service.AirQualitySensor(this.name_air_quality, undefined, undefined);
            this.airQualitySensor
                .addCharacteristic(EveAirQualityPpmCharacteristic);
            this.airQualitySensor
                .addCharacteristic(EveAirQualityUnknownCharacteristic);
            // Used for showing BSEC IAQ value:
            this.airQualitySensor
                .addCharacteristic(Characteristic.VOCDensity);
            this.airQualitySensor
                .getCharacteristic(Characteristic.VOCDensity)
                .setProps({
                minValue: 0,
                maxValue: 50
            });
            this.airQualitySensor.log = this.log;
            this.temperatureService.log = this.log;
            this.loggingService = new FakeGatoHistoryService("room", this.temperatureService, {
                storage: 'fs',
                disableTimer: true,
                filename: this.name + ".json"
            });
            this.spawnIAQProcess();
        }
        ensurePolling() {
            if (this.polling) {
                return;
            }
            this.polling = true;
            this.devicePolling();
            setInterval(this.devicePolling.bind(this), this.refresh * 1000);
        }
        devicePolling() {
            debug("Polling BME680: " + new Date(Date.now()).toLocaleString());
            if (this.sensor) {
                this.sensor.read()
                    .then(data => {
                    let defaultIAQ = 50;
                    const event = {
                        time: moment().unix(),
                        temp: roundInt(data.temperature),
                        pressure: roundInt(data.pressure),
                        humidity: roundInt(data.humidity),
                        ppm: PPM_OFFSET // UNKNOWN
                    };
                    if (this.iaqData) {
                        // IAQ -> eve ppm 
                        event.ppm = PPM_OFFSET + this.iaqData.iaq * FACTOR_BSEC_IAQ_EVE_PPM;
                        this.log(`iaq: ${this.iaqData.iaq}, eve quality: ${event.ppm} ppm`);
                    }
                    this.log(event);
                    this.loggingService.addEntry(event);
                    if (this.spreadsheetId) {
                        this.log_event_counter = this.log_event_counter + 1;
                        if (this.log_event_counter > 59) {
                            this.logger.storeBME(this.name, 0, roundInt(data.temperature), roundInt(data.humidity), roundInt(data.pressure));
                            this.log_event_counter = 0;
                        }
                    }
                    let qualityDescription;
                    let homeKitQuality;
                    let ppm = event.ppm;
                    // if (iaq >= 0 && iaq < 50) {
                    //   homeKitQuality = 1;
                    //   qualityDescription = "good";
                    // } else if (iaq >= 50 && iaq < 100) {
                    //   homeKitQuality = 2;
                    //   qualityDescription = "average";
                    // } else if (iaq >= 100 && iaq < 150) {
                    //   homeKitQuality = 3;
                    //   qualityDescription = "little bad";
                    // } else if (iaq >= 150 && iaq < 200) {
                    //   homeKitQuality = 4;
                    //   qualityDescription = "bad";
                    // } else if (iaq >= 200 && iaq < 300) {
                    //   homeKitQuality = 4;
                    //   qualityDescription = "worse";
                    // } else if (iaq >= 300) {
                    //   homeKitQuality = 5;
                    //   qualityDescription = "very bad";
                    // }
                    if (ppm >= 450 && ppm < 700) {
                        homeKitQuality = 1;
                        qualityDescription = "good";
                    }
                    else if (ppm >= 700 && ppm < 1100) {
                        homeKitQuality = 2;
                        qualityDescription = "average";
                    }
                    else if (ppm >= 1100 && ppm < 1600) {
                        homeKitQuality = 3;
                        qualityDescription = "little bad";
                    }
                    else if (ppm >= 1600 && ppm < 2100) {
                        homeKitQuality = 4;
                        qualityDescription = "bad";
                    }
                    else if (ppm >= 2100) {
                        homeKitQuality = 5;
                    }
                    this.log(`iaq: ${homeKitQuality} ${qualityDescription}`);
                    this.temperatureService
                        .setCharacteristic(Characteristic.CurrentTemperature, roundInt(data.temperature));
                    this.temperatureService
                        .setCharacteristic(CustomCharacteristic.AtmosphericPressureLevel, roundInt(data.pressure));
                    this.humidityService
                        .setCharacteristic(Characteristic.CurrentRelativeHumidity, roundInt(data.humidity));
                    this.airQualitySensor
                        .setCharacteristic(EveAirQualityPpmCharacteristic, roundInt(event.ppm));
                    if (this.iaqData) {
                        this.airQualitySensor
                            .setCharacteristic(Characteristic.VOCDensity, roundInt(this.iaqData.iaq));
                    }
                    // Characteristic.AirQuality.UNKNOWN = 0;
                    // Characteristic.AirQuality.EXCELLENT = 1;
                    // Characteristic.AirQuality.GOOD = 2;
                    // Characteristic.AirQuality.FAIR = 3;
                    // Characteristic.AirQuality.INFERIOR = 4;
                    // Characteristic.AirQuality.POOR = 5;
                    this.airQualitySensor
                        .setCharacteristic(Characteristic.AirQuality, homeKitQuality); // 1(EXCELLENT) 2 (GOOD)  3 (FAIR) 4 (INFERIOR ) 5 (POOR)
                })
                    .catch(err => {
                    this.log(`BME read error: ${err}`);
                    debug(err.stack);
                    if (this.spreadsheetId) {
                        this.logger.storeBME(this.name, 1, -999, -999, -999);
                    }
                });
            }
            else {
                this.log("Error: bme680 Not Initalized");
            }
        }
        getServices() {
            return [this.informationService, this.temperatureService, this.humidityService, this.airQualitySensor, this.loggingService];
        }
        /**
         *
         * IAQ Index Air Quality
            0 – 50 good10
            51 – 100 average
            101 – 150 little bad
            151 – 200 bad
            201 – 300 worse
            301 – 500 very bad
        
         *
         * Using Eve Room, the measured gas concentration of VOCs is converted into equivalent
          CO2 concentration that is easy to read. The Eve app displays current and historical
          measurements in ppm. Values are displayed in different colors and divided into
          “Excellent” (450-700 ppm), “Good” (700-1100 ppm), “Acceptable“ (1100-1600 ppm),
          “Moderate” (1600-2100 ppm), and “Poor” (above 2100 ppm). Depending on the
          ventilation and number of people in the room, users should try to keep air quality at
          an “Excellent” or “Good” level.
         *
         * @returns
         * @memberof BME680Plugin
         */
        spawnIAQProcess() {
            if (this.iaqProcess) {
                return;
            }
            this.log(process.cwd());
            // ensure that bsec_iaq.config is located in storagePath (e.g. ~./homebridge) and is writable ( for bsec_iaq.state):
            this.iaqProcess = child_process_1.spawn(__dirname + '/../lib/bsec_bme680', [], {
                cwd: homebridgeRef.user.storagePath(),
                env: process.env
            });
            this.iaqProcess.stderr.setEncoding('utf8');
            this.iaqProcess.stdin.setDefaultEncoding('utf8');
            this.iaqProcess.stdout.setEncoding('utf8');
            this.iaqProcess.once('error', (error) => {
                this.cleanup();
                this.log("iaqProcess: ERROR");
                debugger;
                this.log(error);
            });
            this.iaqProcess.stderr.once('data', (data) => {
                this.cleanup();
                this.log("iaqProcess: ERROR: stderr");
                debugger;
                this.log(data);
            });
            this.iaqProcess.stdout.on('data', (data) => {
                try {
                    this.iaqData = JSON.parse(data);
                    this.ensurePolling();
                }
                catch (e) {
                    this.log("unable to parse iaq result: " + e);
                }
            });
            this.iaqProcess.once('exit', () => {
                this.cleanup();
            });
        }
        /**
         * Cleanup after the iaq process has exited.
         *
         */
        cleanup() {
            if (this.iaqProcess) {
                this.iaqProcess.removeAllListeners();
                this.iaqProcess = null;
            }
        }
    }
    function roundInt(string) {
        return Math.round(parseFloat(string) * 10) / 10;
    }
    function debug(val) {
        global.console.debug(val);
    }
});
//# sourceMappingURL=sensor.js.map