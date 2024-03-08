const achievements = require('./storage/achievements.json');
const admin = require('firebase-admin');

class Achievement {
	constructor (_bot, _settings, _db, _logger) {
		this.logger = _logger;
		this.bot = _bot;
		this.db = _db;
		this.settings = _settings;
		this.achievements = achievements;
		this.logger.log('Achievement constructed', "info");
		this.start();
	}

	async start() {

	}

	async h_messages(_msg) {
		// check if there are achievements with any requirement with type - messages in list
		// if so - parse them and see if the user has reached the required amount from _data
		// if so - add the achievement to the user

		if (this.achievements && this.achievements.length > 0) {
			for (const achievement of this.achievements) {
				if (achievement.requirements && achievement.requirements.length > 0) {
					if (achievement.requirements.find(r => r.type == "messages")) {
						if (await this.requirementsMet(_msg, achievement)) {
							this.achievementAdd(_msg, achievement);
							this.achievementMessage(_msg, achievement);
						}
					}
				}
			}
		}	
	}

	async h_register(_msg, _data) {
		this.logger.log(_msg.from.id +" " + _data.username + ": " + this.settings.locale.console.ach_register_check, "info");
		//this.logger.log(JSON.stringify(this.achievements,null,2), "debug")
		let achievement = this.achievements.find(a => a.id == "start");
		if (!achievement || !achievement.requirements) { return; }
		let result = await this.requirementsMet(_msg, achievement);
		if (result === true) {
			this.achievementAdd(_msg, achievement);
		}
	}	

	async achievementAdd(_msg, _achievement) {
		this.logger.log(this.settings.locale.console.ach_add + _achievement.name + " to user: " + _msg.from.id + ":\n" + JSON.stringify(_achievement,null,2), "info");
		
		try {
			_achievement.time = admin.firestore.Timestamp.fromDate(new Date());
			if (await this.db.db_user_push(_msg, this.settings.path.db.user.achievement, _achievement)) {
				this.achievementMessage(_msg, _achievement);
				return true;
			} else {
				this.logger.log(this.settings.locale.console.ach_add_error + _msg.from.id + ":\n" + JSON.stringify(_achievement,null,2), "error");
				return false;
			}
		} catch (error) {
			this.logger.log(`Error adding achievement: ${error.stack}`, "error");
			return false;
		}
	}

	async achievementMessage(_msg, _achievement) {
		try {
			let message = this.settings.locale.base.ach_recieved + _achievement.name + "\n" + _achievement.description + "\n" + JSON.stringify(_achievement.requirements, null, 2) + JSON.stringify(_achievement.reward, null, 2);
			if (this.bot && typeof this.bot.sendMessage === 'function') {
				this.bot.sendMessage(_msg.chat.id, message, _msg.message_id);
			} else {
				this.logger.log('Bot or sendMessage function is undefined', "error");
			}
		} catch (error) {
			this.logger.log(`Error sending achievement message: ${error.stack}`, "error");
		}
	}

	async requirementsMet(_msg, _achievement) {
		let requirements = _achievement.requirements;
		this.logger.log("Checking requirements for " + _achievement.name + " for user: " + _msg.from.id + ":\n" + JSON.stringify(requirements, null, 2), "debug");
		let result = true;
		for (const requirement of requirements) {
			if (requirement.type == "message") {
				result = result && await this.messageRequirementMet(_msg, requirement);
			} else if (requirement.type == "register") {
				result = result && await this.db.db_user_isRegistered(_msg);
			}
		}
		return result;	
	}

	async messageRequirementMet(_msg, _requirement) {
		let result = false;
		let messages = await this.db.db_get_messages(_msg);
		if ( _requirement.value <= messages) { result = true; }
		return result;	
	}
}

module.exports = Achievement;

// ачивка "брат куда так гонишь" - 10 сообщений за минуту