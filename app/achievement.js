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
			_app.logger.log(_msg.from.id +" " + _data.username + ": " + _app.SETTINGS.locale.console.ach_register_check, "info");
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
			_app.logger.log(_app.SETTINGS.locale.console.ach_add + _achievement.name + " to user: " + _msg.from.id + ":\n" + _achievement.id, "info");
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
			_app.logger.log(_app.SETTINGS.locale.console.ach_message_prepare + _achievement.name + " to user: " + _msg.from.id, "info");
			let message = _app.SETTINGS.locale.base.ach_recieved + "\n";
			message += _app.HELPER.str_style(_achievement.name, "bold") + "\n";
			message += _app.HELPER.str_style(_achievement.description, "italic") + "\n";

			// if there are rewards
			if (_achievement.reward) {
				_app.reward.rewardsAdd(_msg, _achievement.reward, true);
				_app.bot.sendMessage(_msg.chat.id, message, _msg.message_id);
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
			let messages = await _app.CACHE.update(_app.HELPER.userpath(_msg) + _app.SETTINGS.path.db.user.messages) || 0;
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