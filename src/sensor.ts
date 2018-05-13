'use strict';
import { initCustomCharacteristic } from "./CustomCharacteristic";
import { EventEmitter } from "events";
import { spawn, exec, ChildProcess } from "child_process";
import { inherits } from "util";
const path = require('path');

const bme680_sensor = require('jvsbme680');
var logger = require("mcuiot-logger").logger;
const moment = require('moment');
var os = require("os");
var hostname = os.hostname();

// temperatur and humidity compensation when reading IAQ values with heated sensor:
// see also kvaruni's comment on callibration & compensation:
// https://forums.pimoroni.com/t/bme680-observed-gas-ohms-readings/6608/5
// TODO: make configurable:
let bsecIAQTempCompensation = -0.35; // or 0.7 ?
let bsecIAQHumidityCompensation = 4.0;


let Service: HAPNodeJS.Service;
let Characteristic: HAPNodeJS.Characteristic;
var CustomCharacteristic;
var FakeGatoHistoryService;

let EveAirQualityPpmCharacteristic;
let EveAirQualityUnknownCharacteristic;

// TODO: make configurable
const REFRESH_TIME_IN_MINUTES = 10;

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
  CustomCharacteristic = initCustomCharacteristic(homebridge);
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

  inherits(EveAirQualityPpmCharacteristic, Characteristic);

  (<any>EveAirQualityPpmCharacteristic).UUID = 'E863F10B-079E-48FF-8F27-9C2605A29F52';


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

  inherits(EveAirQualityUnknownCharacteristic, Characteristic);
  (<any>EveAirQualityUnknownCharacteristic).UUID = 'E863F132-079E-48FF-8F27-9C2605A29F52';
}

class BME680Plugin {


  useBsecLib: any;
  toPpm(gas_resistance: number): number {
    // dummy implementation
    return PPM_OFFSET + (CO2_MAX_VALUE - PPM_OFFSET) * gas_resistance / 1000000;
  }

  iaqProcess: ChildProcess;
  loggingService: any;
  airQualitySensor: any; //AirQualitySensor;
  humidityService: any;//HAPNodeJS.Service.HumiditySensor;
  temperatureService: any;
  informationService: any;
  sensor: BME680;
  //  data: {};
  logger: any;
  log_event_counter: number;
  name: string;
  name_temperature: string;
  name_humidity: string;
  name_air_quality: string;
  refresh: number;
  options: any;
  spreadsheetId: any;

  iaqData: IAQResult;

  polling = false;

  constructor(private log, config) {
    this.log = log;
    this.name = config.name;
    this.useBsecLib = config.useBsecLib || false;

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

    if ('i2cBusNo' in this.options) this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
    if ('i2cAddress' in this.options) this.options.i2cAddress = parseInt(this.options.i2cAddress);
    this.log(`bme680 sensor options: ${JSON.stringify(this.options)}`);

    try {
      // Creates an instance of `BME680`.
      // uses default i2c address  [i2cAddress='0x76'] See I2C address (see `Constants.I2CAddress` for valid values)
      // Constants.I2CAddress.I2CA_PRIMARY
      this.log("init bme680 sensor ...");
      // TODO: consider this.options.i2cAddress
      if (!this.useBsecLib) {
        this.sensor = new bme680_sensor.BME680();
      }
      this.log("initialized bme680 sensor")
    } catch (ex) {
      this.log("bme680 initialization failed:", ex);
    }
    this.updateHistoryAndCurrentServices.bind(this);

    this.informationService = new Service.AccessoryInformation(undefined, undefined, undefined);

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, "Bosch")
      .setCharacteristic(Characteristic.Model, "RPI-BME680")
      .setCharacteristic(Characteristic.SerialNumber, hostname + "-" + hostname)
      .setCharacteristic(Characteristic.FirmwareRevision, require('./../package.json').version);

    this.temperatureService = new Service.TemperatureSensor(this.name_temperature, /*TRHO*/undefined, undefined);

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

    // Fake VOCDensity sensor used for showing BSEC IAQ value (0-500)
    // There is no history support for this value
    this.airQualitySensor
      .addCharacteristic(Characteristic.VOCDensity);
    this.airQualitySensor
      .getCharacteristic(Characteristic.VOCDensity)
      .setProps({
        minValue: 0,
        maxValue: 500
      });

    this.airQualitySensor.log = this.log;

    this.temperatureService.log = this.log;
    this.loggingService = new FakeGatoHistoryService("room", this.temperatureService,
      {
        storage: 'fs',
        disableTimer: true, // timer is not triggered; therefore disabling timer and relying own interval updates
        filename: this.name + ".json"
      });
    if (this.useBsecLib) {
      this.spawnIAQProcess();
    } else {
      this.ensurePolling();
    }

  }



  private ensurePolling() {
    if (this.polling) {
      return;
    }
    this.polling = true;
    //this.devicePolling();

    this.scheduleUpdate();
  }

  private scheduleUpdate() {
    let now = new Date();
    let firstPollAlignedWithHour = this.refresh - (now.getMinutes() * 60 + now.getSeconds()) % (this.refresh);
    this.log(`scheduled history update in ${Math.round(firstPollAlignedWithHour / 60)} min, ${firstPollAlignedWithHour % 60} sec`);

    // update sensors, but not history:
    this.updateHistoryAndCurrentServices(false);
    setTimeout(() => {
      this.updateHistoryAndCurrentServices();
      this.scheduleUpdate();
    }, firstPollAlignedWithHour * 1000);
  }

  read(): Promise<RoomEvent> {
    if (this.iaqData) {
      return Promise.resolve(
        this.bsecResultsToEvent());
    } else {
      return this.sensor.read().then(data => {
        debug("Polling BME680: " + new Date(Date.now()).toLocaleString());
        debug(data);
        return {
          time: moment().unix(),
          temp: roundInt(data.temperature),
          pressure: roundInt(data.pressure),
          humidity: roundInt(data.humidity),
          ppm: this.toPpm(data.gasResistance) // heuristic
        };
      });
    }
  }

  private bsecResultsToEvent(): RoomEvent {

    return {
      time: moment().unix(),
      temp: roundInt(this.iaqData.raw_temperature + bsecIAQTempCompensation),
      humidity: roundInt(this.iaqData.raw_humidity + bsecIAQHumidityCompensation),
      pressure: roundInt(this.iaqData.pressure),
      ppm: PPM_OFFSET + this.iaqData.iaq * FACTOR_BSEC_IAQ_EVE_PPM
    };
  }

  updateHistoryAndCurrentServices(updateHistory = true) {

    this.read().then((event) => {

      if (updateHistory) {
        if (this.aggMeasurements) {
          this.log(this.aggMeasurements);
          this.aggMeasurements.time = moment().unix();
          this.loggingService.addEntry(this.aggMeasurements);
        } else {
          this.log(event);
          this.loggingService.addEntry(event);
        }

        if (this.spreadsheetId) {
          this.log_event_counter = this.log_event_counter + 1;
          if (this.log_event_counter > 59) {
            this.logger.storeBME(this.name, 0, event.temp, event.humidity, event.pressure);
            this.log_event_counter = 0;
          }
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
      } else if (ppm >= 700 && ppm < 1100) {
        homeKitQuality = 2;
        qualityDescription = "average";
      } else if (ppm >= 1100 && ppm < 1600) {
        homeKitQuality = 3;
        qualityDescription = "little bad";
      } else if (ppm >= 1600 && ppm < 2100) {
        homeKitQuality = 4;
        qualityDescription = "bad";
      } else if (ppm >= 2100) {
        homeKitQuality = 5;
      }

      this.log(`iaq: ${homeKitQuality} ${qualityDescription}`)
      if (this.aggMeasurements) {
        this.updateSensors(this.aggMeasurements);
      } else {
        this.updateSensors(event);
      }

      // Optional
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

  MAX_MEASUREMENT_COUNT = 20; // collect data for 1 min (3*20 sec)

  aggMeasurements: RoomEvent;
  sumsMeasurements: RoomEvent;

  private updateSensors(event: RoomEvent) {

    this.temperatureService
      .setCharacteristic(Characteristic.CurrentTemperature, event.temp);
    this.temperatureService
      .setCharacteristic(CustomCharacteristic.AtmosphericPressureLevel, event.pressure);
    this.humidityService
      .setCharacteristic(Characteristic.CurrentRelativeHumidity, event.humidity);
    this.airQualitySensor
      .setCharacteristic(EveAirQualityPpmCharacteristic, event.ppm);

  }

  private aggregateMeasurements(event: RoomEvent) {
    if (!this.sumsMeasurements) {
      this.sumsMeasurements = event;
    } else {
      this.sumsMeasurements.temp += event.temp;
      this.sumsMeasurements.humidity += event.humidity;
      this.sumsMeasurements.pressure += event.pressure;
      this.sumsMeasurements.ppm += event.ppm;
    }
    if (this.readCounter % this.MAX_MEASUREMENT_COUNT == 0) {  // log and push aggregated values every ~ 30 sec
      this.sumsMeasurements.time = event.time;
      this.sumsMeasurements.temp = roundInt(this.sumsMeasurements.temp / this.MAX_MEASUREMENT_COUNT);
      this.sumsMeasurements.humidity = roundInt(this.sumsMeasurements.humidity / this.MAX_MEASUREMENT_COUNT);
      this.sumsMeasurements.pressure = roundInt(this.sumsMeasurements.pressure / this.MAX_MEASUREMENT_COUNT);
      this.sumsMeasurements.ppm = roundInt(this.sumsMeasurements.ppm / this.MAX_MEASUREMENT_COUNT);
      this.aggMeasurements = this.sumsMeasurements;

      let agg = this.aggMeasurements;
      this.sumsMeasurements = undefined;

      this.updateSensors(this.aggMeasurements);
      this.log(`last: ${agg.temp} (raw: ${this.iaqData.raw_temperature}, comp: ${roundInt(this.iaqData.raw_temperature + bsecIAQTempCompensation)}) C, ${agg.humidity} (raw: ${this.iaqData.raw_humidity}, comp: ${roundInt(this.iaqData.raw_humidity + bsecIAQHumidityCompensation)}) %RH, ${agg.ppm} ppm, IAQ: ${this.iaqData.iaq} IAQ, IAQ accuray:  ${this.iaqData.iaq_accuracy}`);
    }


  }

  getServices() {
    return [this.informationService, this.temperatureService, this.humidityService, this.airQualitySensor, this.loggingService]
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

  readCounter = 0;

  spawnIAQProcess() {
    if (this.iaqProcess) {
      return;
    }

    this.log(process.cwd())

    // ensure that bsec_iaq.config is located in storagePath (e.g. ~./homebridge) and is writable ( for bsec_iaq.state):
    this.iaqProcess = spawn(homebridgeRef.user.storagePath() + '/bsec_bme680', [],
      {
        cwd: homebridgeRef.user.storagePath(),
        env: process.env
      }
    );
    this.iaqProcess.stderr.setEncoding('utf8');
    this.iaqProcess.stdin.setDefaultEncoding('utf8');
    this.iaqProcess.stdout.setEncoding('utf8');

    this.iaqProcess.once('error', (error) => {
      this.cleanup();
      this.log("ERROR: bsec_bme680 failed");
      this.log(error);
    });

    this.iaqProcess.stderr.once('data', (data) => {
      this.cleanup();
      this.log("ERROR: bsec_bme680 does not run without errors, ensure that bsec_iaq.config is in the homebridge storagePath (e.g. ~./homebridge) and the directory is writable");
      this.log(data);
    });

    this.iaqProcess.stdout.on('data', (data: string) => {
      try {
        this.iaqData = JSON.parse(data);
        this.readCounter++;

        const event = this.bsecResultsToEvent();
        this.aggregateMeasurements(event);

        this.ensurePolling();
      } catch (e) {
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
  private cleanup() {
    if (this.iaqProcess) {
      this.iaqProcess.removeAllListeners();
      this.iaqProcess = null;
    }
  }

}

function roundInt(string) {
  return Math.round(parseFloat(string) * 100) / 100;
}


function debug(val: any) {
  global.console.debug(val);
}

interface IAQResult {
  iaq: number;
  iaq_accuracy: number;
  raw_temperature: number;
  raw_humidity: number;
  temperature: number;
  humidity: number;
  pressure: number;
  gas_pressure: number;
  bsec_status: number;
}
interface RoomEvent {
  time: number;
  temp: number;
  pressure: number;
  humidity: number;
  ppm: number;
}

