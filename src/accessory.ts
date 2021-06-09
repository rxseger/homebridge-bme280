import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  HAP,
  Logging,
  Service
} from "homebridge";
import AM2320 from "./sensor"

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("AM2320", AM2320Plugin);
};

class AM2320Plugin implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly name_temperature: string;
  private readonly name_humidity: string;

  private readonly temperatureService: Service;
  private readonly humidityService: Service;
  private readonly informationService: Service;

  private readonly am2320: AM2320

  constructor(log: Logging, config: AccessoryConfig, _api: API) {
    this.log = log;
    this.name = config.name;
    this.name_temperature = config.name_temperature ?? this.name;
    this.name_humidity = config.name_humidity ?? this.name;

    this.am2320 = new AM2320(config.options);

    this.temperatureService = new hap.Service.TemperatureSensor(this.name_temperature);
    this.temperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on(CharacteristicEventTypes.GET, this.getCurrentTemperature);

    this.humidityService = new hap.Service.TemperatureSensor(this.name_humidity);
    this.humidityService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on(CharacteristicEventTypes.GET, this.getCurrentRelativeHumidity);
  
    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Kawabata Farm")
      .setCharacteristic(hap.Characteristic.Model, "AM2320");

    log.info("AM2320 finished initializing!");
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log("Identify!");
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.temperatureService,
      this.humidityService,
      this.informationService,
    ];
  }

  private async getCurrentTemperature(callback: CharacteristicGetCallback) {
    const value = await this.am2320.getCurrentTemperature();
    callback(undefined, value);
  }

  private async getCurrentRelativeHumidity(callback: CharacteristicGetCallback) {
    const value = await this.am2320.getCurrentRelativeHumidity();
    callback(undefined, value);
  }

}
