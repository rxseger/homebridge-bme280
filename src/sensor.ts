// import i2c from "i2c";
import _ from "lodash";

export default class AM2320
{
  private sensor: any;
  private options: any;
  private promise: any;

  constructor(options: any) {
    this.options = _.defaults({}, options, {
      temperature: {
        rate: 1.0
      },
      humidity: {
        rate: 1.0
      }
    });

    this.promise = null;

    if ('i2cBusNo' in this.options) this.options.i2cBusNo = parseInt(this.options.i2cBusNo);
    if ('i2cAddress' in this.options) this.options.i2cAddress = parseInt(this.options.i2cAddress);
    console.log(`AM23280 sensor options: ${JSON.stringify(this.options)}`);
    // this.sensor = new i2c(this.options.i2cAddress, { device: '/dev/i2c-' + this.options.i2cBusNo });

    var self = this;
    setTimeout(() => {
      self.promise = this.readSensorData(this.sensor);
      self.promise.then((data: any) => {
        console.log(`data = ${JSON.stringify(data, null, 2)}`);
      }).catch((err: any) => {
        console.log(`AM2320 read error: ${err}`);
      }).then(() => {
        self.promise = null;
      });
    }, 1000);
  }

  private readRegister(wire: any): Promise<any>  {
    return new Promise((resolve, reject) => {
      var counter = 0;
      const i = setInterval(() => {
        wire.readBytes(0x00, 8, (err: any, res: number[]) => {
          if (err || res[0] == 0) {
            if (++counter > 100) {
              clearInterval(i);
              reject(err); 
            } 
          } else {
            var t = (((res[4] & 0x7f) << 8) + res[5]) / 10.0;
            t = ((res[4] & 0x80) >> 7) == 1 ? t * (-1) : t;
            var h = ((res[2] << 8) + res[3]) / 10.0;
            clearInterval(i);
            resolve({ temperature: t, humidity: h });
          }
        });
      }, 15);
    });
  }

  private wakeup(wire: any): Promise<void>  {
    return new Promise((resolve) => {
      wire.writeByte(0x00, () => {
        setTimeout(resolve, 15);
      });
    });
  }

  private writeRegister(wire: any, bytes: any): Promise<void> {
    return new Promise((resolve, reject) => {
      wire.writeBytes(0x03, bytes, (err: any) => {
        if (err) {
          reject(err);
        } else {
          setTimeout(resolve, 15);
        }
      });
    });
  }

  // refresh sensor data
  private readSensorData(wire: any): Promise<any> {
    var self = this;
    return new Promise((resolve, reject) => {
      if (wire.lastUpdate !== undefined) {
        var diff = process.hrtime(wire.lastUpdate);
        if (diff[0] < 30) {
          resolve(wire.lastValue);
        }
      }

      self.wakeup(wire).then(async () => {
        return await self.writeRegister(wire, [0x00, 0x04]);
      }).then(async () => {
        return await self.readRegister(wire);
      }).then((data) => {
        wire.lastValue = data;
        wire.lastUpdate = process.hrtime();
        resolve(data);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  public getCurrentTemperature(): Promise<number> {
    var self = this;
    return new Promise((resolve, reject) => {
      if (!self.promise) {
        self.promise = self.readSensorData(self.sensor);
      }
      self.promise.then((data: any) => {
        console.log(`data(temp) = ${JSON.stringify(data, null, 2)}`);
        resolve(data.temperature * self.options.temperature.rate);
      }).catch((err: any) => {
        console.log(`AM2320 read error: ${err}`);
        reject(err);
      }).then(() => {
        self.promise = null;
      });
    });
  }

  public getCurrentRelativeHumidity(): Promise<number> {
    var self = this;
    return new Promise((resolve, reject) => {
      if (!self.promise) {
        self.promise = self.readSensorData(self.sensor);
      }
      self.promise.then((data: any) => {
        console.log(`data(humi) = ${JSON.stringify(data, null, 2)}`);
        resolve(data.humidity * self.options.humidity.rate);
      }).catch((err: any) => {
        console.log(`AM2320 read error: ${err}`);
        reject(err);
      }).then(() => {
        self.promise = null;
      });
    });
  }
}

