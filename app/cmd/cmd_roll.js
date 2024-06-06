class C_ROLL {
	async run(_msg, _app) {
		try {
			_app.logger.log("Starting /roll for: " + _msg.from.id, "info");

			const user = await _app.db.db_user(_msg);

			if (!user) {
				_app.commands.msg_notRegistered(_msg);
				return false;
			}

			const _lastRoll = await this.get_lastRoll(_msg, _app, user);
			if (_lastRoll) {
				const message = _app.SETTINGS.locale.base.cmd_roll_fail_already + "\n" + _app.HELPER.str_style(`[${_lastRoll.id}][${_lastRoll.rarity}][${_lastRoll.name}]`, _app.SETTINGS.rarity[_lastRoll.rarity] && _app.SETTINGS.rarity[_lastRoll.rarity].text || "");
				_app.bot.sendMessage(_msg.chat.id, message, _msg.message_id);

				return true;
			} else {
				const _record = await this.give_reward(_msg, _app);
				_app.logger.log("Rolled new reward: " + _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text), "info");
				return true;
			}
		} catch (error) {
			_app.logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	async get_lastRoll(_msg, _app, user) {
		const lastRoll = user.stats?.roll?.last;
		const lastRollTime = lastRoll && lastRoll.time ? new Date(lastRoll.time) : new Date(1337, 0, 1);

		let _result = _app.HELPER.is_today(lastRollTime) ? lastRoll : null;
		_app.logger.log("Checking if last /roll was today: " + _app.HELPER.is_today(lastRollTime), "info");

		return _result;
	}

	async give_reward(_msg, _app) {
		_app.logger.log("Rolling new reward", "info");

		const _rarity = await _app.reward.randomRarity(_app);
		const item = await _app.reward.randomReward(_app, _rarity);

		const _record = await _app.reward.rewardAdd(_app, _msg.from.id, item, false);

		if (!_record) {return false;}

		await this.update_db_records(_msg, _app, _record);

		_app.logger.log("Reward added: " + _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text), "info");
		_app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_roll_success + _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text), _msg.message_id)

		return _record;		
	}

	async update_db_records(_msg, _app, reward) {
		try {
			await _app.db.increment(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.stats.rollCount);
			await _app.db.override(_app.SETTINGS.path.db.users + _msg.from.id +_app.SETTINGS.path.db.stats.lastRoll, reward);
			return true;
		} catch (error) {
			_app.logger.log(`Error updating database records: ${error.stack}`, "error");
			return false;
		}
	}
}

module.exports = C_ROLL;