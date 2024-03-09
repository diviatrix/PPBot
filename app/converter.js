const settings = require('./storage/settings.json');

class Converter {
  constructor(_logger) {
	this.logger = _logger;
	this.settings = settings;
	this.logger.log('Converter constructed', "debug");
  }

  start() {
	this.logger.log('Converter started', "debug");
  }

  str_style(_string, _style) {
	this.logger.log(`Styling sting [${_string}] to [${_style}]`, "debug");
	let result = _string;
	if (this.settings.messageStrings[_style]) {
		let style = this.settings.messageStrings[_style];
		result = `${style.open}${_string}${style.close}`;
	} else {
		this.logger.log("Invalid style: " + _style, "warning");
	}
	return result;
  }
}
module.exports = Converter;