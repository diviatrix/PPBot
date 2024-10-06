let APP;
class C_ROLL {
	constructor(_app) {
		APP = _app;
		APP.LOGGER.log('C_ROLL constructed', "debug");
	}
	async run(_msg) {
		try {
			APP.LOGGER.log("Starting /roll for: " + _msg.from.id, "info");

			const user = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id);

			if (!user) {
				APP.commands.msg_notRegistered(_msg);
				return false;
			}

			const _lastRoll = user.stats?.roll?.last;
			const _lastRollTime = _lastRoll && _lastRoll.time ? new Date(_lastRoll.time) : new Date(1337, 0, 1);

			if (APP.HELPER.is_today(_lastRollTime)) {
				const message = APP.SETTINGS.locale.base.cmd_roll_fail_already + "\n" + APP.HELPER.str_style(`[${_lastRoll?.id}][${_lastRoll?.rarity}][${_lastRoll?.name}]`, APP.SETTINGS.rarity[_lastRoll?.rarity] && APP.SETTINGS.rarity[_lastRoll?.rarity].text || "");
				APP.BOT.sendMessage(_msg.chat.id, message, _msg.message_id);

				return true;
			} else {
				const _record = await this.give_random_reward(_msg);
				APP.LOGGER.log("Rolled new reward: " + APP.HELPER.reward_record_style(_record, APP.SETTINGS.rarity[_record.rarity].text), "info");
				return true;
			}
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	async give_random_reward(_msg) {
		APP.LOGGER.log("Rolling new reward", "info");

		const _rarity = await APP.FUNCTIONS.random_rarity();
		const _item = await APP.FUNCTIONS.random_reward( _rarity);

		const _record = await APP.FUNCTIONS.reward_add(_msg.from.id, _item);

		if (!_record) {return false;}
		APP.LOGGER.log(JSON.stringify(_record), "debug");
		await this.update_db_records(_msg, _record);

		APP.LOGGER.log("Reward added: " + APP.HELPER.reward_record_style(_record, APP.SETTINGS.rarity[_record.rarity].text), "info");
		APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_roll_success + APP.HELPER.reward_record_style(_record, APP.SETTINGS.rarity[_record.rarity].text), _msg.message_id)

		return _record;		
	}

	async update_db_records(_msg, _record) {
		try {
			APP.LOGGER.log("Updating database records", "info");
			await APP.DB.increment(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.stats.rollCount);
			await APP.DB.set(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.stats.lastRoll, _record);
			return true;
		} catch (error) {
			APP.LOGGER.log(`Error updating database records: ${error.stack}`, "error");
			return false;
		}
	}
}

module.exports = C_ROLL;