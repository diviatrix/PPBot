class C_ROLL {
	async run(_msg, app, logger) {
		try {
			logger.log(app.SETTINGS.locale.console.bot_cmd_roll_start + _msg.from.id, "info");

			const user = await app.db.db_user(_msg);

			if (!user) {
				app.COMMANDS.msg_notRegistered(_msg);
				return false;
			}

			const _lastRoll = await this.get_lastRoll(_msg, app, logger, user);
			if (_lastRoll) {
				const message = app.SETTINGS.locale.base.cmd_roll_fail_already + "\n" + app.HELPER.str_style(`[${_lastRoll.id}][${_lastRoll.rarity}][${_lastRoll.name}]`, app.SETTINGS.rarity[_lastRoll.rarity] && app.SETTINGS.rarity[_lastRoll.rarity].text || "");
				app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);

				return true;
			} else {
				const reward = await this.give_reward(_msg, app, logger);
				logger.log(app.SETTINGS.locale.console.bot_cmd_roll_new_success + JSON.stringify(reward, null, 2), "info");
				return true;
			}
		} catch (error) {
			logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	async get_lastRoll(_msg, app, logger, user) {
		logger.log(app.SETTINGS.locale.console.bot_cmd_roll_time, "info");
		const lastRoll = user.stats?.roll?.last;
		const lastRollTime = lastRoll && lastRoll.time ? new Date(lastRoll.time) : new Date(1337, 0, 1);
		logger.log(JSON.stringify(lastRoll, null, 2), "info");

		return app.HELPER.is_today(lastRollTime) ? lastRoll : null;
	}

	async give_reward(_msg, app, logger) {
		logger.log(app.SETTINGS.locale.console.bot_cmd_roll_new, "info");

		const rarity = await app.reward.randomRarity();
		const item = await app.reward.randomReward(rarity);

		const reward = await app.reward.rewardAdd(_msg, item, false);

		if (reward) {
			await this.update_db_records(_msg, app, reward.record, logger);

			const message = app.SETTINGS.locale.base.cmd_roll_success + reward.message;

			app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id)

			return reward;
		}
	}

	async update_db_records(_msg, app, reward, logger) {
		try {
			await app.db.db_user_increment(_msg, app.SETTINGS.path.db.stats.rollCount);
			await app.db.db_user_override(_msg, app.SETTINGS.path.db.stats.lastRoll, reward);
			return true;
		} catch (error) {
			logger.log(`Error updating database records: ${error.stack}`, "error");
			return false;
		}
	}
}

module.exports = C_ROLL;