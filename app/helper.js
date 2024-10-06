let APP;

class Helper {
  constructor(_app) {
	APP = _app;
	APP.LOGGER.log('Helper constructed', "debug");
  }

  str_style(_string, _style) {
	APP.LOGGER.log(`Styling sting [${_string}] to [${_style}]`, "debug");
	let result = _string;
	if (APP.SETTINGS.messageStrings[_style]) {
		let style = APP.SETTINGS.messageStrings[_style];
		result = `${style.open}${_string}${style.close}`;
	} else {
		APP.LOGGER.log("Invalid style, returning input: " + "[" + _style + "]" + result, "warning");
		return result;
	}
	return result;
  }

  reward_record_style(_record) {
	return this.str_style(`[${_record.id}][${_record.rarity}][${_record.name}]`,APP.SETTINGS.rarity[_record.rarity].text || "normal");
  }

  is_today(_date) {
	const today = new Date();
	try {
		return (_date.getDate() == today.getDate() && _date.getMonth() == today.getMonth() && _date.getFullYear() == today.getFullYear())
	}
	catch (error) {
		APP.LOGGER.log(`Error: ${error}`, "error");
		return false;
	}	
  }

  userpath(_msg) {
	APP.LOGGER.log(`Generated userpath:${APP.SETTINGS.path.db.users + "/" + _msg.from.id}`, "debug");
	return APP.SETTINGS.path.db.users + "/" + _msg.from.id;
  }
}
module.exports = Helper;