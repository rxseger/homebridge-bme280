'use strict';

const i2c = require('i2c');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-am2320', 'AM2320', AM2320Plugin);
};

class AM2320Plugin
{
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.name_temperature = config.name_temperature || this.name;
    this.name_humidity = config.name_humidity || this.name;
    this.options = config.options || {};

    this.promise = null;

    this.init = false;
    this.data = {};
    if ('i2cBusNo' in this.options) this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
    if ('i2cAddress' in this.options) this.options.i2cAddress = parseInt(this.options.i2cAddress);
    console.log(`AM23280 sensor options: ${JSON.stringify(this.options)}`);
    this.sensor = new i2c(this.options.i2cAddress, { device: '/dev/i2c-' + this.options.i2cBusNo });
    this.init = true;

    var self = this;
    setTimeout(() => {
      self.promise = this.readSensorData(this.sensor);
      self.promise.then((data) => {
        console.log(`data = ${JSON.stringify(data, null, 2)}`);
      }).catch((err) => {
        console.log(`AM2320 read error: ${err}`);
      }).then(() => {
        self.promise = null;
      });
    }, 1000);

    this.temperatureService = new Service.TemperatureSensor(this.name_temperature);

    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    this.humidityService = new Service.HumiditySensor(this.name_humidity);
    this.humidityService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCurrentRelativeHumidity.bind(this));
  }

  readRegister(wire, cb) {
    const i = setInterval(() => {
      wire.readBytes(0x00, 8, (err, res) => {
        if (!err && res[0] != 0) {
          var t = (((res[4] & 0x7f) << 8) + res[5]) / 10.0;
          t = ((res[4] & 0x80) >> 7) == 1 ? t * (-1) : t;
          var h = ((res[2] << 8) + res[3]) / 10.0;
          clearInterval(i);
          cb(err, { temperature: t, humidity: h });
        }
      });
    }, 15);
  }

  // refresh sensor data
  readSensorData(wire) {
    var self = this;
    return new Promise((resolve, reject) => {
      if (wire.lastUpdate !== undefined) {
        var diff = process.hrtime(wire.lastUpdate);
        if (diff[0] < 30) {
          resolve(wire.lastValue);
        }
      }
      wire.writeByte(0x00, (err) => {
        setTimeout(() => {
          wire.writeBytes(0x03, [0x00, 0x04], (err) => {
            if (err) {
              reject(err);
              return;
            }
            setTimeout(() => {
              self.readRegister(wire, (err, data) => {
                if (err) {
                  reject(err);
                  return;
                }
                wire.lastValue = data;
                wire.lastUpdate = process.hrtime();
	        resolve(data);
              });
            }, 15);
          });
        }, 15);
      });
    });
  }

  getCurrentTemperature(cb) {
    var self = this;
    if (!self.promise) {
      self.promise = self.readSensorData(self.sensor);
    }
    self.promise.then((data) => {
      console.log(`data(temp) = ${JSON.stringify(data, null, 2)}`);
      cb(null, data.temperature);
    }).catch((err) => {
      console.log(`AM2320 read error: ${err}`);
      cb(err);
    }).then(() => {
      self.promise = null;
    });
  }

  getCurrentRelativeHumidity(cb) {
    var self = this;
    if (!self.promise) {
      self.promise = self.readSensorData(self.sensor);
    }
    self.promise.then((data) => {
      console.log(`data(humi) = ${JSON.stringify(data, null, 2)}`);
      cb(null, data.humidity);
    }).catch((err) => {
      console.log(`AM2320 read error: ${err}`);
      cb(err);
    }).then(() => {
      self.promise = null;
    });
  }

  getServices() {
    return [this.temperatureService, this.humidityService]
  }
}

