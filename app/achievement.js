module.exports = class Achievement {
	async h_messages(_msg, _app) {
		if (_app.achievements && _app.achievements.length > 0) {
			for (const achievement of _app.achievements) {
				if (achievement.requirements && achievement.requirements.length > 0) {
					if (achievement.requirements.find(r => r.type == "message")) {
						if (await this.requirementsMet(_msg, achievement, _app)) {
							this.achievementAdd(_msg, achievement, _app);
						}
					}
				}
			}
		}   
	}
	
	async h_register(_msg, _data, _app) {
		try {
			_app.logger.log("Checking for register event achievements: " + _msg.from.id +" " + _data.username + ": ", "info");
			let achievement = _app.achievements.find(a => a.id == "start");
			if (achievement) {
				let result = await this.requirementsMet(_msg, achievement, _app);
				if (result === true) {
					await this.achievementAdd(_msg, achievement, _app);
				}
			} else {
				_app.logger.log('Achievement with id "start" not found', "error");
			}
		} catch (error) {
			_app.logger.log(`Error in h_register: ${error.stack}`, "error");
		}
	}	

	async achievementAdd(_msg, _achievement, _app) {		
		try {
			_app.logger.log("Adding achievement: " + _achievement.name + " to user: " + _msg.from.id + ":\n" + _achievement.id, "info");
			_achievement.time = await _app.db.time();
			await _app.db.push(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.user.achievement, _achievement);
			return await this.achievementMessage(_msg, _achievement, _app);			 
		} catch (error) {
			_app.logger.log(`Error adding achievement: ${error.stack}`, "error");
			return false;
		}
	}

	async user_achievements(_msg, _app) {
		let data = await _app.CACHE.get(_app.HELPER.userpath(_msg) + _app.SETTINGS.path.db.user.achievement);
		return data;
	}

	async achievementMessage(_msg, _achievement, _app) {
		try {
			_app.logger.log("Preparing achievement message: " + _achievement.name + " to user: " + _msg.from.id, "info");
			let _message = _app.SETTINGS.locale.base.ach_recieved + "\n";
			_message += _app.HELPER.str_style(_achievement.name, "bold") + "\n";
			_message += _app.HELPER.str_style(_achievement.description, "italic") + "\n\n";

			// if there are rewards
			if (_achievement.reward) {
				for (const _reward of _achievement.reward) {
					const _rewardObject = await _app.reward.collectible(_app, _reward.id, _reward.rarity);
					_app.logger.log(`Reward object: ${JSON.stringify(_rewardObject, null, 2)}`, "debug");
		
					if (_rewardObject) {
							let _record = await _app.reward.rewardAdd(_app, _msg.from.id, _reward); 
							if (_record) {
								_app.logger.log("Reward added: " + JSON.stringify(_record, null, 2), "info");
								_message += _app.SETTINGS.locale.base.cmd_bonus_success + _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text || "normal") + "\n";
							}
					} else {
						_app.logger.log(`Can not add reward with id ${_reward.id} and rarity ${_reward.rarity}`, "error");
						_app.bot.sendMessage(_msg.chat.id, `Can not add reward with id ${_reward.id} and rarity ${_reward.rarity}`, _msg.message_id);
					}
				}
				_app.bot.sendMessage(_msg.chat.id, _message, _msg.message_id);
			}

			
		} catch (error) {
			_app.logger.log(`Error sending achievement message: ${error.stack}`, "error");
		}
	}

	async requirementsMet(_msg, _achievement, _app) {
		let requirements = _achievement.requirements;
		_app.logger.log("Checking requirements for " + _app.HELPER.str_style(_achievement.name, "bold") + " for user: " + _msg.from.id + ": " + requirements.length , "debug");
		let result = false;
		for (const requirement of requirements) {
			if (requirement.type == "message") {
				result = await this.messageRequirementMet(_msg, requirement, _app) || result;
			} else if (requirement.type == "register") {
				result = await _app.db.exist(_app.SETTINGS.path.db.users + _msg.from.id) || result;
			}
		}
		return result;	
	}

	async messageRequirementMet(_msg, _requirement, _app) {
		try {
			let result = false;
			let messages = await _app.CACHE.get(_app.HELPER.userpath(_msg) + _app.SETTINGS.path.db.user.messages) || 0;
			_app.logger.log("Checking message requirement for user: " + _msg.from.id + " with value: " + _requirement.value + " and messages: " + messages, "debug");
			if ( _requirement.value == messages) { result = true; }
			return result;	
		} catch (error) {
			_app.logger.log(`Error checking message requirement: ${error.stack}`, "error");
			return false;
		}
	}
}

// ачивка "брат куда так гонишь" - 10 сообщений за минуту