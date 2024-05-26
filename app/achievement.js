class Achievement {
	constructor (_app) {
		this.app = _app;
		this.logger = _app.logger;
		this.helper = _app.helper;
		this.SETTINGS = _app.SETTINGS;
		this.achievements = _app.achievements;
		this.logger.log('Achievement constructed', "info");
		this.start();
	}

	async start() {

	}

	async h_messages(_msg) {
		if (this.achievements && this.achievements.length > 0) {
			for (const achievement of this.achievements) {
				if (achievement.requirements && achievement.requirements.length > 0) {
					if (achievement.requirements.find(r => r.type == "message")) {
						if (await this.requirementsMet(_msg, achievement)) {
							this.achievementAdd(_msg, achievement);
						}
					}
				}
			}
		}   
	}
	
	async h_register(_msg, _data) {
		try {
			this.logger.log(_msg.from.id +" " + _data.username + ": " + this.SETTINGS.locale.console.ach_register_check, "info");
			let achievement = this.achievements.find(a => a.id == "start");
			if (achievement) {
				let result = await this.requirementsMet(_msg, achievement);
				if (result === true) {
					this.achievementAdd(_msg, achievement);
				}
			} else {
				this.logger.log('Achievement with id "start" not found', "error");
			}
		} catch (error) {
			this.logger.log(`Error in h_register: ${error.stack}`, "error");
		}
	}	

	async achievementAdd(_msg, _achievement) {
		this.logger.log(this.SETTINGS.locale.console.ach_add + _achievement.name + " to user: " + _msg.from.id + ":\n" + _achievement.id, "info");
		
		try {
			

			_achievement.time = this.app.db.time();
			if (await this.app.db.db_user_push(_msg, this.SETTINGS.path.db.user.achievement, _achievement)) {
				this.achievementMessage(_msg, _achievement);
				return true;
			} else {
				this.logger.log(this.SETTINGS.locale.console.ach_add_error + _msg.from.id + ":\n" + JSON.stringify(_achievement,null,2), "error");
				return false;
			}
		} catch (error) {
			this.logger.log(`Error adding achievement: ${error.stack}`, "error");
			return false;
		}
	}

	async user_achievements(_msg) {
		let user = await this.app.db.db_user(_msg);
		return user.achievement;
	}

	async achievementMessage(_msg, _achievement) {
		try {
			this.logger.log(this.SETTINGS.locale.console.ach_message_prepare + _achievement.name + " to user: " + _msg.from.id, "info");
			let message = this.SETTINGS.locale.base.ach_recieved + "\n";
			message += this.app.helper.str_style(_achievement.name, "bold") + "\n";
			message += this.app.helper.str_style(_achievement.description, "italic") + "\n";

			// if there are rewards
			if (_achievement.reward) {
				this.app.reward.rewardsAdd(_msg, _achievement.reward);
				this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);
			}

			
		} catch (error) {
			this.logger.log(`Error sending achievement message: ${error.stack}`, "error");
		}
	}

	async requirementsMet(_msg, _achievement) {
		let requirements = _achievement.requirements;
		this.logger.log("Checking requirements for " + this.helper.str_style(_achievement.name, "bold") + " for user: " + _msg.from.id + ": " + requirements.length , "debug");
		let result = false;
		for (const requirement of requirements) {
			if (requirement.type == "message") {
				result = await this.messageRequirementMet(_msg, requirement) || result;
			} else if (requirement.type == "register") {
				result = await this.app.db.db_user_isRegistered(_msg) || result;
			}
		}
		return result;	
	}

	async messageRequirementMet(_msg, _requirement) {
		try {
			let result = false;
			let messages = await this.app.db.db_get_messages(_msg);
			this.logger.log("Checking message requirement for user: " + _msg.from.id + " with value: " + _requirement.value + " and messages: " + messages, "debug");
			if ( _requirement.value == messages) { result = true; }
			return result;	
		} catch (error) {
			this.logger.log(`Error checking message requirement: ${error.stack}`, "error");
			return false;
		}
	}
}

module.exports = Achievement;

// ачивка "брат куда так гонишь" - 10 сообщений за минуту