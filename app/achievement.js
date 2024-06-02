let app;
module.exports = class Achievement {
	constructor (_app) {
		app = _app;
		app.logger.log('Achievement constructed', "info");
		this.start();
	}

	async start() {

	}

	async h_messages(_msg) {
		if (app.achievements && app.achievements.length > 0) {
			for (const achievement of app.achievements) {
				if (achievement.requirements && achievement.requirements.length > 0) {
					if (achievement.requirements.find(r => r.type == "message")) {
						if (await this.requirementsMet(_msg, achievement)) {
							app.achievementAdd(_msg, achievement);
						}
					}
				}
			}
		}   
	}
	
	async h_register(_msg, _data) {
		try {
			app.logger.log(_msg.from.id +" " + _data.username + ": " + app.SETTINGS.locale.console.ach_register_check, "info");
			let achievement = app.achievements.find(a => a.id == "start");
			if (achievement) {
				let result = await this.requirementsMet(_msg, achievement);
				if (result === true) {
					await this.achievementAdd(_msg, achievement);
				}
			} else {
				app.logger.log('Achievement with id "start" not found', "error");
			}
		} catch (error) {
			app.logger.log(`Error in h_register: ${error.stack}`, "error");
		}
	}	

	async achievementAdd(_msg, _achievement) {
		app.logger.log(app.SETTINGS.locale.console.ach_add + _achievement.name + " to user: " + _msg.from.id + ":\n" + _achievement.id, "info");
		
		try {
			_achievement.time = await app.db.time();
			await app.db.push(app.SETTINGS.path.db.users + _msg.from.id + app.SETTINGS.path.db.user.achievement, _achievement);
			return await this.achievementMessage(_msg, _achievement);			 
		} catch (error) {
			app.logger.log(`Error adding achievement: ${error.stack}`, "error");
			return false;
		}
	}

	async user_achievements(_msg) {
		let data = await app.CACHE.get(app.HELPER.userpath(_msg) + app.SETTINGS.path.db.user.achievement);
		return data;
	}

	async achievementMessage(_msg, _achievement) {
		try {
			app.logger.log(app.SETTINGS.locale.console.ach_message_prepare + _achievement.name + " to user: " + _msg.from.id, "info");
			let message = app.SETTINGS.locale.base.ach_recieved + "\n";
			message += app.HELPER.str_style(_achievement.name, "bold") + "\n";
			message += app.HELPER.str_style(_achievement.description, "italic") + "\n";

			// if there are rewards
			if (_achievement.reward) {
				app.reward.rewardsAdd(_msg, _achievement.reward, true);
				app.bot.sendMessage(_msg.chat.id, message, _msg.message_id);
			}

			
		} catch (error) {
			app.logger.log(`Error sending achievement message: ${error.stack}`, "error");
		}
	}

	async requirementsMet(_msg, _achievement) {
		let requirements = _achievement.requirements;
		app.logger.log("Checking requirements for " + app.HELPER.str_style(_achievement.name, "bold") + " for user: " + _msg.from.id + ": " + requirements.length , "debug");
		let result = false;
		for (const requirement of requirements) {
			if (requirement.type == "message") {
				result = await this.messageRequirementMet(_msg, requirement) || result;
			} else if (requirement.type == "register") {
				result = await app.db.exist(app.SETTINGS.path.db.users + _msg.from.id) || result;
			}
		}
		return result;	
	}

	async messageRequirementMet(_msg, _requirement) {
		try {
			let result = false;
			let messages = await app.CACHE.update(app.HELPER.userpath(_msg) + app.SETTINGS.path.db.user.messages) || 0;
			app.logger.log("Checking message requirement for user: " + _msg.from.id + " with value: " + _requirement.value + " and messages: " + messages, "debug");
			if ( _requirement.value == messages) { result = true; }
			return result;	
		} catch (error) {
			app.logger.log(`Error checking message requirement: ${error.stack}`, "error");
			return false;
		}
	}
}

// ачивка "брат куда так гонишь" - 10 сообщений за минуту