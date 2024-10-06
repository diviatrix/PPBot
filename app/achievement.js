let APP;
module.exports = class Achievement {

	constructor(_app) {
		APP = _app;
		APP.LOGGER.log('Achievement constructed', "debug");
	}
	async h_messages(_msg) {
		if (APP.ACHIEVEMENTS && APP.ACHIEVEMENTS.length > 0) {
			for (const _achievement of APP.ACHIEVEMENTS) {
				if (_achievement.requirements && _achievement.requirements.length > 0) {
					if (_achievement.requirements.find(r => r.type == "message")) {
						if (await this.requirementsMet(_msg, _achievement)) {
							this.achievementAdd(_msg, _achievement);
						}
					}
				}
			}
		}   
	}
	
	async h_register(_msg, _data) {
		try {
			APP.LOGGER.log("Checking for register event achievements: " + _msg.from.id +" " + _data.username + ": ", "info");
			let _achievement = APP.ACHIEVEMENTS.find(a => a.id == "start");
			if (_achievement) {
				let _result = await this.requirementsMet(_msg, _achievement);
				if (_result === true) {
					await this.achievementAdd(_msg, _achievement);
				}
			} else {
				APP.LOGGER.log('Achievement with id "start" not found', "error");
			}
		} catch (error) {
			APP.LOGGER.log(`Error in h_register: ${error.stack}`, "error");
		}
	}	

	async achievementAdd(_msg, _achievement) {		
		try {
			APP.LOGGER.log("Adding achievement: " + _achievement.name + " to user: " + _msg.from.id + ":\n" + _achievement.id, "info");
			_achievement.time = await APP.DB.time();
			await APP.DB.push(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.user.achievement, _achievement);
			return await this.achievementMessage(_msg, _achievement);			 
		} catch (error) {
			APP.LOGGER.log(`Error adding achievement: ${error.stack}`, "error");
			return false;
		}
	}

	async user_achievements(_msg) {
		let data = await APP.DB.get(APP.HELPER.userpath(_msg) + APP.SETTINGS.path.db.user.achievement);
		return data;
	}

	async achievementMessage(_msg, _achievement) {
		try {
			APP.LOGGER.log("Preparing achievement message: " + _achievement.name + " to user: " + _msg.from.id, "info");
			let _message = APP.SETTINGS.locale.base.ach_recieved + "\n";
			_message += APP.HELPER.str_style(_achievement.name, "bold") + "\n";
			_message += APP.HELPER.str_style(_achievement.description, "italic") + "\n\n";

			// if there are rewards
			if (_achievement.reward) {
				for (const _reward of _achievement.reward) {
					const _rewardObject = APP.FUNCTIONS.collectible(_reward.guid);
					APP.LOGGER.log(`Reward object: ${JSON.stringify(_rewardObject, null, 2)}`, "debug");
		
					if (_rewardObject) {
							let _record = await APP.REWARD.rewardAdd(_msg.from.id, _reward); 
							if (_record) {
								APP.LOGGER.log("Reward added: " + JSON.stringify(_record, null, 2), "info");
								_message += APP.SETTINGS.locale.base.cmd_bonus_success + APP.HELPER.reward_record_style(_record) + "\n";
							}
					} else {
						APP.LOGGER.log(`Can not add reward with id ${_reward.id} and rarity ${_rewardObject.rarity.text}`, "error");
						APP.BOT.sendMessage(_msg.chat.id, `Can not add reward with id ${_reward.id} and rarity ${_rewardObject.rarity.text}`, _msg.message_id);
					}
				}
				APP.BOT.sendMessage(_msg.chat.id, _message, _msg.message_id);
			}

			
		} catch (error) {
			APP.LOGGER.log(`Error sending achievement message: ${error.stack}`, "error");
		}
	}

	async requirementsMet(_msg, _achievement) {
		let requirements = _achievement.requirements;
		APP.LOGGER.log("Checking requirements for " + APP.HELPER.str_style(_achievement.name, "bold") + " for user: " + _msg.from.id + ": " + requirements.length , "debug");
		let result = false;
		for (const requirement of requirements) {
			if (requirement.type == "message") {
				result = await this.messageRequirementMet(_msg, requirement) || result;
			} else if (requirement.type == "register") {
				result = await APP.DB.exist(APP.SETTINGS.path.db.users + _msg.from.id) || result;
			}
		}
		return result;	
	}

	async messageRequirementMet(_msg, _requirement) {
		try {
			let result = false;
			let messages = await APP.DB.get(APP.HELPER.userpath(_msg) + APP.SETTINGS.path.db.user.messages) || 0;
			APP.LOGGER.log("Checking message requirement for user: " + _msg.from.id + " with value: " + _requirement.value + " and messages: " + messages, "debug");
			if ( _requirement.value == messages) { result = true; }
			return result;	
		} catch (error) {
			APP.LOGGER.log(`Error checking message requirement: ${error.stack}`, "error");
			return false;
		}
	}
}

// ачивка "брат куда так гонишь" - 10 сообщений за минуту