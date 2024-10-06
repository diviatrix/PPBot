let APP;
module.exports = class Reward {
	constructor(_app) {
		APP = _app;
		APP.LOGGER.log("Reward constructed", "info");
	}	

	async writeDB(_record, message) {
		try {
			// push reward record to database
			await APP.DB.set(APP.SETTINGS.path.db.stats.lastReward, _record);
			await APP.DB.push(APP.SETTINGS.path.db.stats.dailyrewards, _record);
			await this.daily_rewards_update();
			await APP.DB.push(APP.SETTINGS.path.db.users + _record.userid + APP.SETTINGS.path.db.user.collectible, _record);
		
			APP.LOGGER.log(`Records of reward added: ${message}`, "debug");
			return true;
		} catch (error) {
			APP.LOGGER.log(`Error in writeDB: ${error.stack}`, "error");
			return false;
		}
	}

	async daily_rewards_update() {
		try {
			let _list = await APP.DB.get(APP.SETTINGS.path.db.stats.dailyrewards);
			APP.LOGGER.log(`Records of daily rewards from db: ${Object.keys(_list).length}`, "debug");

			// prepare new list without yesterday or older records
			let _newList = {};

			for (const key in _list) {
				if (Object.prototype.hasOwnProperty.call(_list, key)) {
					const _item = _list[key];
					if (APP.HELPER.is_today(new Date(_item.time))) {
						_newList[key] = _item;
					} else {
						await APP.DB.delete(APP.SETTINGS.path.db.stats.dailyrewards + key); // clean up old records in db
					}
				}
			}

			// sort _newList object by item.id
			_newList = Object.keys(_newList).sort().reduce(
				(obj, key) => {
					obj[key] = _newList[key];
					return obj;
				},
				{}
			);

			APP.LOGGER.log (`Records of daily reward cleaned up in db: ${Object.keys(_newList).length}`, "debug");
			return true;
		} catch (error) {
			APP.LOGGER.log(`Error in daily_rewards_update: ${error.stack}`, "error");
			return false;
		}
	}
}