const SETTINGS = require('./storage/settings.json');

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
		this.logger.log("Invalid style, returning input: " + "[" + _style + "]" + result, "warning");
		return result;
	}
	return result;
  }

  is_today(_date) {
	const today = new Date();
	return (_date.getDate() == today.getDate() && _date.getMonth() == today.getMonth() && _date.getFullYear() == today.getFullYear())
  }

  userpath(_msg) {
	this.logger.log(`Generated userpath:${this.SETTINGS.path.db.users + "/" + _msg.from.id}`, "debug");
	return this.SETTINGS.path.db.users + "/" + _msg.from.id;
  }
}
module.exports = Helper;