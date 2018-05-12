### v0.0.2
* Reduced characteristic service updates (temperatur, humidity, IAQ, pressure) interval to 1 minute and history update interval to 10 min
* Calculate mean temperatur, humidity, IAQ, pressure value from last 20 measurement in a minute interval 
* Added temperatur and humidity compensation when reading IAQ values with heated sensor with bsec_bme680 library
    * see also kvaruni's comment on callibration & compensation:
    * https://forums.pimoroni.com/t/bme680-observed-gas-ohms-readings/6608/5


### v0.0.1
* Initial version, forked from https://github.com/rxseger/homebridge-bme280