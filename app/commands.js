//const TelegramBot = require('node-telegram-bot-api');
class Commands {
	constructor(app, logger) {
		this.app = app;
		this.logger = logger;
		this.settings = app.settings;
		this.commands = app.settings.locale.commands;
		this.commandHandlers = [];
		this.init();
	}	

	init() {
		this.attach_cmd_handlers();
	}

	async msg_notRegistered(_msg) { await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.console.bot_cmd_requirement_register, _msg.message_id); }
	async msg_failed(_msg) { await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.console.bot_cmd_fail, _msg.message_id); }
	
	async attach_cmd_handlers()
	{
		for (let command in this.settings.locale.commands) {
			if (Object.prototype.hasOwnProperty.call(this.commands, command)) {
				// Remove the slash from the command name
				let functionName = "cmd_" + command.slice(1);

				// Check if a function with this name exists in this class
				if (typeof this[functionName] === 'function'){
					// Bind the function to 'this' and store it along with the command name
					this.commandHandlers.push({command: command, handler: this[functionName].bind(this)});
					this.logger.log(command + this.settings.locale.console.bot_cmd_create_pass + this[functionName].name, "info");
				} else { this.logger.log(command + this.settings.locale.console.bot_cmd_func_404, "warning"); }				
			}
		}

		this.logger.log(`CommandHanlers:\n ${JSON.stringify(this.commandHandlers)}`, "debug");
		this.logger.log('Commands initialized', "info");
	}

	async parseCmd(msg) {
		let commandText = msg.text.split('@')[0];
		commandText = commandText.split(' ')[0];
		const params = msg.text.split(' ').slice(1);
		const command = this.commandHandlers.find(({ command: cmd }) => cmd === commandText);

		if (!command) {
			this.cmd_incorrect(msg);
			return;
		}

		try {
			if (!params) {
				await command.handler(msg);
			} else {
				await command.handler(msg, params);
			}
		} catch (error) {
			this.logger.log(`Error executing command ${commandText}: ${error.stack}`, "error");
		}
	}

	async cmd_go(_msg) {
		try {
			if (!await this.app.db.db_user_isRegistered(_msg)) {
				let user = await this.app.db.db_user_new_write(_msg);
				await this.logger.log(this.settings.locale.console.bot_cmd_go_register_pass +  _msg.from.id, "info");
				await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_pass, _msg.message_id);
				await this.app.achievement.h_register(_msg, user);
			}
			else {
				await this.logger.log(this.settings.locale.console.bot_cmd_go_register_fail + _msg.from.id, "warning");
				await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_fail, _msg.message_id);
			}
		} catch (error) {
			this.logger.log(`Error executing cmd_go: ${error.stack}`, "error");
		}		
	}

	async cmd_add(_msg, _params) {
		if (!_params) return this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_add_fail_empty, _msg.message_id);

		if (!await this.app.db.db_user_isRegistered(_msg)) {
			this.msg_notRegistered(_msg);
			return;
		}



		this.logger.log(JSON.stringify(_params), "info");
		// adds suggestion to database as new record in  this.app.db
		this.app.db.db_suggestion_new_write(_msg, _params);
		// adds record about last suggestion to account stats database

		
	}

	async cmd_me(_msg) 
	{
		if (!await this.app.db.db_user_isRegistered(_msg)) 
		{
			this.msg_notRegistered(_msg);
			return;
		} 
		else {
			// read user data from db
			const user = await this.app.db.db_user(_msg);
			if (!user.stats) {
			user.stats = { messages: 0 };}
		
		let message = this.settings.locale.base.cmd_me_pass + "\n";
		message += this.settings.locale.base.cmd_me_messages + (user.stats.messages || 0) + "\n";
		message += this.settings.locale.base.cmd_me_achievements + (user.achievement? Object.keys(user.achievement).length : 0) + "\n";
		message += this.settings.locale.base.cmd_me_collectibles + (user.wallet && user.wallet.collectible? Object.keys(user.wallet.collectible).length : 0) + "\n";

		this.app.tgBot.sendMessage(_msg.chat.id,message, _msg.message_id);
		}
	}

	async cmd_start(_msg){
		await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_start, _msg.message_id);	
	}

	async cmd_roll(_msg) {
		try {
			this.logger.log(this.settings.locale.console.bot_cmd_roll_start + _msg.from.id, "info");

			const user = await this.app.db.db_user(_msg);
			if (!user) return this.msg_notRegistered(_msg);

			const lastRoll = user.stats?.roll?.last;
			const lastRollTime = lastRoll && lastRoll.time ? new Date(lastRoll.time) : new Date(1337, 0, 1);

			let message;

			this.logger.log(this.settings.locale.console.bot_cmd_roll_time, "info");
			if (this.app.helper.is_today(lastRollTime))
			{
				this.logger.log(true, "info"); // check if rolled today
				message = this.settings.locale.base.cmd_roll_fail_already + "\n" + this.app.helper.str_style(`[${lastRoll.id}][${lastRoll.rarity}][${lastRoll.name}]`, this.settings.rarity[lastRoll.rarity] && this.settings.rarity[lastRoll.rarity].text || "");
				this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);
				this.logger.log(JSON.stringify(lastRoll, null, 2), "info");
				return;
			}
			else
			{
				this.logger.log(false, "info"); // check if rolled today
				this.logger.log(this.app.settings.locale.console.bot_cmd_roll_new, "info"); 

				const rarity = await this.app.reward.randomRarity();
				const item = await this.app.reward.randomReward(rarity);
				
				let reward = await this.app.reward.rewardAdd(_msg, item);

				if (reward)
				{
					this.logger.log(this.app.settings.locale.console.bot_cmd_roll_last_update_success + JSON.stringify(await this.app.db.db_user_override(_msg, this.settings.path.db.user.lastRoll, reward)))
					this.logger.log(this.app.settings.locale.console.bot_cmd_roll_count_update_success + _msg.from.id + " - " + JSON.stringify(await this.app.db.db_user_increment(_msg, this.settings.path.db.user.rollCount)))
					message = this.settings.locale.base.cmd_roll_success + "\n" + this.app.helper.str_style(`[${reward.id}][${reward.rarity}][${reward.name}]`, this.settings.rarity[reward.rarity].text)
					this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);

					this.logger.log(this.app.settings.locale.console.bot_cmd_roll_new_success + JSON.stringify(reward, null, 2), "info");

					return item;
				}
			}			
		} catch (error) {
			this.logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	async db_user_last_roll_set(_msg, _reward) {
		try {
			this.logger.log(`${this.app.settings.locale.console.bot_cmd_roll_last_update} ${_msg.from.first_name} ${_msg.from.last_name}, reward: ${_reward.name}`, "info");
		
			
	
			this.logger.log(`${this.app.settings.locale.console.bot_cmd_roll_last_update_success} ${_msg.from.first_name} ${_msg.from.last_name}, reward: ${_reward.name}`, "info");
			} 		
			catch (error) {
			this.logger.log(error.stack, "error");
		}
	}

	// todo : move commands methods to command.js, load commands there also
	async cmd_deleteme(_msg) {
		try {
			if (!await this.app.db.db_user_isRegistered(_msg)) {
				return;
			} else {
				await this.app.db.db_user_erase(_msg);
				await this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_deleteme_pass, _msg.message_id);
				this.logger.log(this.settings.locale.console.bot_cmd_pass  + _msg.from.id, "info");
			}
		} catch (error) {
			this.logger.log(`Error executing: ${error.stack}`, "error");
		}
	}

	async cmd_incorrect(_msg) { await this.app.tgBot.sendMessage(_msg.chat.id,  this.settings.locale.console.bot_cmd_fail + _msg.text, _msg.message_id); }
	async cmd_commands(_msg) {
		if (!await this.app.db.db_user_isRegistered(_msg)) { this.logger.log(this.settings.locale.console.bot_cmd_requirement_register);  return; }
		let message = this.settings.locale.base.bot_cmd_commands + "\n";
		for (const { command } of this.commandHandlers) { message += command + "\n"; }
		await this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);
		this.logger.log(this.settings.locale.console.bot_cmd_commands, "info");
	}
}
module.exports = Commands;