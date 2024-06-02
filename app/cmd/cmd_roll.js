class C_ROLL {
	async run(_msg, _app) {
		try {
			_app.logger.log(_app.SETTINGS.locale.console.bot_cmd_roll_start + _msg.from.id, "info");

			const user = await _app.db.db_user(_msg);

			if (!user) {
				_app.COMMANDS.msg_notRegistered(_msg);
				return false;
			}

			const _lastRoll = await this.get_lastRoll(_msg, _app, user);
			if (_lastRoll) {
				const message = _app.SETTINGS.locale.base.cmd_roll_fail_already + "\n" + _app.HELPER.str_style(`[${_lastRoll.id}][${_lastRoll.rarity}][${_lastRoll.name}]`, _app.SETTINGS.rarity[_lastRoll.rarity] && _app.SETTINGS.rarity[_lastRoll.rarity].text || "");
				_app.bot.sendMessage(_msg.chat.id, message, _msg.message_id);

				return true;
			} else {
				const reward = await this.give_reward(_msg, _app);
				_app.logger.log(_app.SETTINGS.locale.console.bot_cmd_roll_new_success + reward.message, "info");
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
		_app.logger.log(_app.SETTINGS.locale.console.bot_cmd_roll_time + _app.HELPER.is_today(lastRollTime), "info");

		return _result;
	}

	async give_reward(_msg, _app) {
		_app.logger.log(_app.SETTINGS.locale.console.bot_cmd_roll_new, "info");

		const rarity = await _app.reward.randomRarity();
		const item = await _app.reward.randomReward(rarity);

		const reward = await _app.reward.rewardAdd(_msg, item, false);

		if (reward) {
			await this.update_db_records(_msg, _app, reward.record);

			_app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_roll_success + reward.message, _msg.message_id)

			return reward;
		}
	}

	async update_db_records(_msg, _app, reward) {
		try {
			await _app.db.db_increment(app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.stats.rollCount);
			await _app.db.override(app.SETTINGS.path.db.users + _msg.from.id +_app.SETTINGS.path.db.stats.lastRoll, reward);
			return true;
		} catch (error) {
			_app.logger.log(`Error updating database records: ${error.stack}`, "error");
			return false;
		}
	}
}

module.exports = C_ROLL;