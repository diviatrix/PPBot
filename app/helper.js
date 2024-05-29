const SETTINGS = require('./storage/SETTINGS.json');

class Helper {
  constructor(_logger) {
	this.logger = _logger;
	this.SETTINGS = SETTINGS;
	this.logger.log('Helper constructed', "debug");
  }

  start() {
	this.logger.log('Helper started', "debug");
  }

  str_style(_string, _style) {
	this.logger.log(`Styling sting [${_string}] to [${_style}]`, "debug");
	let result = _string;
	if (this.SETTINGS.messageStrings[_style]) {
		let style = this.SETTINGS.messageStrings[_style];
		result = `${style.open}${_string}${style.close}`;
	} else {
		this.logger.log("Invalid style: " + _style, "warning");
	}
	return result;
  }

  is_today(_date) {
	const today = new Date();
	return (_date.getDate() == today.getDate() && _date.getMonth() == today.getMonth() && _date.getFullYear() == today.getFullYear())
  }
}
module.exports = Helper;