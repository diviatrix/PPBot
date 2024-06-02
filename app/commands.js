const path = require('path');
const C_ROLL = require(path.join(__dirname, 'cmd', 'cmd_roll.js'));
const C_TOP = require(path.join(__dirname, 'cmd', 'cmd_top.js'));
const C_ME = require(path.join(__dirname, 'cmd', 'cmd_me.js'));
const C_RAR = require(path.join(__dirname, 'cmd', 'cmd_rar.js'));
const C_BONUS = require(path.join(__dirname, 'cmd', 'cmd_bonus.js'));

module.exports = class COMMANDS {
	constructor(app, logger) {
		this.app = app;
		this.logger = logger;
		this.SETTINGS = app.SETTINGS;
		this.commands = app.SETTINGS.locale.commands;
		this.commandHandlers = [];
		this.attach_cmd_handlers();
	}	

	async msg_notRegistered(_msg) { await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.console.bot_cmd_requirement_register, _msg.message_id); }
	async msg_failed(_msg) { await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.console.bot_cmd_fail, _msg.message_id); }
	
	async attach_cmd_handlers()
	{
		let functionName;
		for (let command in this.SETTINGS.locale.commands) {
			if (Object.prototype.hasOwnProperty.call(this.commands, command)) {
				// Remove the slash from the command name
				functionName = "cmd_" + command.slice(1);

				// Check if a function with this name exists in this class
				if (typeof this[functionName] === 'function'){
					// Bind the function to 'this' and store it along with the command name
					this.commandHandlers.push({command: command, handler: this[functionName].bind(this)});
					this.logger.log(command + this.SETTINGS.locale.console.bot_cmd_create_pass + this[functionName].name, "info");
				} else { this.logger.log(command + this.SETTINGS.locale.console.bot_cmd_func_404, "warning"); }				
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
			if (!await this.app.db.exist(this.app.SETTINGS.path.db.users + _msg.from.id)) {
				let user = this.app.SETTINGS.model.user;

				user.id = _msg.from.id;
				user.username = _msg.from.username || "";
				user.first_name = _msg.from.first_name || "";
				user.last_name = _msg.from.last_name || "";
				user.stats = this.app.SETTINGS.model.stats;
				user.stats.register = {
				  chatId: _msg.chat.id || _msg.from.id,
				  time: await this.app.db.time()
				};
		  
				await this.app.db.push(this.SETTINGS.path.db.users + user.id, user);

				await this.logger.log(this.SETTINGS.locale.console.bot_cmd_go_register_pass +  _msg.from.id, "info");
				await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_go_pass, _msg.message_id);
				await this.app.achievement.h_register(_msg, user, this.app);
				return user;
			}
			else {
				await this.logger.log(this.SETTINGS.locale.console.bot_cmd_go_register_fail + _msg.from.id, "warning");
				await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_go_fail, _msg.message_id);
			}
		} catch (error) {
			this.logger.log(`Error executing cmd_go: ${error.stack}`, "error");
		}		
	}

	async cmd_add(_msg, _params) {
		if (!_params) return this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_add_fail_empty, _msg.message_id);

		if (!await this.app.db.exist(app.SETTINGS.path.db.users + _msg.from.id)) {
			this.msg_notRegistered(_msg);
			return;
		}

		this.logger.log(JSON.stringify(_params), "info");
		// adds suggestion to database as new record in  this.app.db
		let record = {
			chatId: _msg.chat.id || _msg.from.id,
			msgId: _msg.message_id || 0,
			text: _params || "",
			time: this.app.db.time(),
			userId: _msg.from.id || 0,
			name: _msg.from.first_name || "" + _msg.from.last_name || ""
		}
		await this.app.db.push(this.app.SETTINGS.path.db.suggestions, record);
		this.app.logger.log("Suggestion written to database:" + record, "debug");

		await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_add_pass, _msg.message_id);
		return record;
		// adds record about last suggestion to account stats database		
	}

	async cmd_me(_msg) 
	{
		try {
			if (await new C_ME().run(_msg, this.app)){return true}
			else { 				
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			this.logger.log(`Error executing cmd_me: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_rar(_msg) {
		try {
			if (await new C_RAR().run(_msg, this.app)){return true}
			else { 
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			this.logger.log(`Error executing cmd_rar: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_start(_msg){
		await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_start, _msg.message_id);	
	}

	async cmd_roll(_msg) {
		try {
			await new C_ROLL().run(_msg, this.app, this.logger);
		} catch (error) {
			this.logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	// todo : move commands methods to command.js, load commands there also
	async cmd_deleteme(_msg) {
		try {
			if (!await this.app.db.exist(this.app.SETTINGS.path.db.users + _msg.from.id)) {
				return;
			} else {
				await this.app.db.delete(this.app.SETTINGS.path.db.users + _msg.from.id);
				await this.app.bot.sendMessage(_msg.chat.id, this.SETTINGS.locale.base.cmd_deleteme_pass, _msg.message_id);
				this.logger.log(this.SETTINGS.locale.console.bot_cmd_pass  + _msg.from.id, "info");
			}
		} catch (error) {
			this.logger.log(`Error executing: ${error.stack}`, "error");
		}
	}

	async cmd_incorrect(_msg) { await this.app.bot.sendMessage(_msg.chat.id,  this.SETTINGS.locale.console.bot_cmd_fail + _msg.text, _msg.message_id); }
	async cmd_commands(_msg) {
		if (!await this.app.db.exist(this.app.SETTINGS.path.db.users + _msg.from.id)) { this.logger.log(this.SETTINGS.locale.console.bot_cmd_requirement_register);  return; }
		let message = this.SETTINGS.locale.base.bot_cmd_commands + "\n";
		for (const { command } of this.commandHandlers) { message += command + "\n"; }
		await this.app.bot.sendMessage(_msg.chat.id, message, _msg.message_id);
		this.logger.log(this.SETTINGS.locale.console.bot_cmd_commands, "info");
	}

	async cmd_top(_msg, _params)
	{
		try {
			if (await new C_TOP().run(_msg, this.app, _params || [])){return true}
			else { 
				this.app.bot.sendMessage(_msg.chat.id, this.app.SETTINGS.locale.base.cmd_top_fail, _msg.message_id);
				return false;
			}		
		} catch (error) {
			this.logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_bonus(_msg, _params)
	{
		try {
			if (await new C_BONUS().run(_msg, this.app, _params || [])){return true}
			else { 
				this.cmd_incorrect(_msg);
				return false;
			}		
		} catch (error) {
			this.logger.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}
}