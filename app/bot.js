const TelegramBot = require('node-telegram-bot-api');
class TGBot {
	constructor(_app) {
		this.app = _app;
		this.logger = _app.logger;
		this.settings = _app.settings;
		this.commands = _app.settings.locale.commands;
		this.bot;
		this.username;
		this.commandHandlers = [];	
		this.start();
		this.logger.log('Bot constructed', "info");
	}

	async start() {
		await this.token_verify();
		await this.attach_cmd_handlers();
		await this.bot_start();
	}

	async bot_start() {
		// start BOT	
		if (!this.bot) this.bot = new TelegramBot(this.settings.token);		

		this.bot.on('text', (msg) => { this.handleMessage(msg);	});
		await this.bot.startPolling();
		await this.bot.getMe().then(botInfo => {
			this.username = botInfo.username;
		});
	}

	async token_verify() {
		if(this.settings.verifyToken)
		{
			this.logger.log(this.settings.locale.console.bot_token_verify_start, "info");

			if (!await this.token_verify_connect(this.settings.token)) { this.logger.log(this.settings.locale.console.bot_token_verify_fail, "error"); return false; }
			else { this.logger.log(this.settings.locale.console.bot_token_verify_pass, "info"); return true;	}
		}
	}
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

	async stop() {
		await this.bot.stop();
		this.bot = null;
		return true;
	}

	async token_verify_connect(_token) {		
		// try to connect, if success disconnect and return true, else disconnect return false
		this.bot = new TelegramBot(_token);
		try {
			await this.bot.startPolling();
			await this.bot.stopPolling();
			this.logger.log(this.settings.locale.console.bot_token_verify_pass, "info");
			return true;
		} catch (error) {
			if (this.bot.isPolling()) this.bot.stopPolling();
			this.logger.log(this.settings.locale.console.bot_token_verify_fail + error, "error");
			return false;
		}
	}

	async sendMessage(chatID, message, replyID) {
		try {
			if (!message || !chatID) { this.logger.log(this.settings.locale.console.bot_msg_verify_fail + message + chatID, "error"); return; }
		
			const options = replyID ? { reply_to_message_id: replyID, parse_mode: 'HTML' } : { parse_mode: 'HTML' };
			await this.bot.sendMessage(chatID, message, options);

			this.logger.log(this.settings.locale.console.bot_msg_send_pass + chatID + ": " + message, "info");
		} 
		catch (error) { this.logger.log(this.settings.locale.console.bot_msg_send_fail + error.stack, "error");	}
	}	

	async handleMessage(msg) {
		// if chat is not private or not from the bot itself, check if chat is in chatId whitelist
		if (!this.whitelist_check(msg)) { return; }
		
		this.logger.log(`[${msg.chat.id}][${msg.from.id}][${msg.from.username}][${msg.from.first_name} ${msg.from.last_name}]: ${msg.text}`, "info");

		if (msg.text.startsWith('/') && msg.text.length > 1) {	this.parseCmd(msg);	} 
		else { this.handleNormalMessage(msg); }
	}

	async whitelist_check(msg){
		if (msg.chat.id != msg.from.id && !this.settings.chatId.includes(msg.chat.id)) {
			this.logger.log("Message from : [" + msg.from.id + "][" + msg.chat.id + "] is not from allowed chat list", "warning"); 
			return; 
		}
	}

	async parseCmd(msg) {
		try {
			this.logger.log(`Parsing command: ${msg.text}`, "debug");
			// if command has @ parse only before @ and ignore everything after it, this in no parameter command
			let parsedCmd;
			let params;
			if (msg.text.includes('@'))	{ 
				let _split = await msg.text.split("@");
				this.logger.log(`Command split: ${_split}`, "debug");
				parsedCmd = _split[0]; 
				if (_split[1] != this.username) 
				{
					this.logger.log(this.username + ": Command ran for another user: " + _split[1], "info");
					return;
				}
			}
			else if (msg.text.includes(" ")) { parsedCmd = msg.text.split(" ")[0]; params = msg.text.split(" ").slice(1); }
			else { parsedCmd = msg.text; }
			
			if (!parsedCmd) { this.cmd_incorrect(msg); this.logger.log("Command not found: ", "warn"); return; }
			this.logger.log(`Command parsed: ${parsedCmd}`, "debug");
			if (this.commandHandlers.find(({ command: cmd }) => parsedCmd === cmd)) {
				this.logger.log(`Command found: ${parsedCmd}`, "debug");
				const commandHandler = this.commandHandlers.find(({ command: cmd }) => parsedCmd === cmd);
				try {
					if (params) { await commandHandler.handler(msg, params); }
					else { await commandHandler.handler(msg); }
				}
				catch (error) { this.logger.log(`Error executing command ${parsedCmd}: ${error.stack}`, "error"); }
			} else { this.cmd_incorrect(msg); }
		} catch (error) {
			this.logger.log(`Error parsing command: ${error}`, "error");
		}
	}
	async cmd_go(_msg, _params) {
		try {
			if (!await this.app.db.db_user_isRegistered(_msg)) {
				let user = await this.app.db.db_user_new_write(_msg);
				await this.logger.log(this.settings.locale.console.bot_cmd_go_register_pass +  _msg.from.id, "info");
				await this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_pass, _msg.message_id);
				await this.app.achievement.h_register(_msg, user);
			}
			else {
				await this.logger.log(this.settings.locale.console.bot_cmd_go_register_fail + _msg.from.id, "warning");
				await this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_fail, _msg.message_id);
			}
		} catch (error) {
			this.logger.log(`Error executing cmd_go: ${error.stack}`, "error");
		}		
	}

	async cmd_me(_msg, _params) {	
		if (!await this.app.db.db_user_isRegistered(_msg)) {
			this.logger.log(this.settings.locale.console.bot_cmd_registered_fail + _msg.from.id, "debug");
			return;
		} else {
			// read user data from db
			const user = await this.app.db.db_user(_msg);
			let message = this.settings.locale.base.cmd_me_pass + "\n";
			message += this.settings.locale.base.cmd_me_messages + (user.stats.messages || 0) + "\n";
			message += this.settings.locale.base.cmd_me_achievements + (user.achievement ? Object.keys(user.achievement).length : 0) + "\n";
			message += this.settings.locale.base.cmd_me_collectibles + (user.wallet && user.wallet.collectible ? Object.keys(user.wallet.collectible).length : 0) + "\n";

			this.sendMessage(_msg.chat.id,message, _msg.message_id);
		}
	}

	async cmd_start(_msg){
		await this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_start, _msg.message_id);	
	}

	// todo : move commands methods to command.js, load commands there also
	async cmd_deleteme(_msg) {
		try {
			if (!await this.app.db.db_user_isRegistered(_msg)) {
				return;
			} else {
				await this.app.db.db_user_erase(_msg);
				await this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_deleteme_pass, _msg.message_id);
				this.logger.log(this.settings.locale.console.bot_cmd_pass  + _msg.from.id, "info");
			}
		} catch (error) {
			this.logger.log(`Error executing: ${error.stack}`, "error");
		}
	}

	async cmd_incorrect(_msg) { await this.sendMessage(_msg.chat.id,  this.settings.locale.console.bot_cmd_fail, _msg.message_id); }
	async cmd_commands(_msg) {
		if (!await this.app.db.db_user_isRegistered(_msg)) { this.logger.log(this.settings.locale.console.bot_cmd_requirement_register);  return; }
		let message = this.settings.locale.base.bot_cmd_commands + "\n";
		for (const { command } of this.commandHandlers) { message += command + "\n"; }
		await this.sendMessage(_msg.chat.id, message, _msg.message_id);
		this.logger.log(this.settings.locale.console.bot_cmd_commands, "info");
	}
	async handleNormalMessage(_msg) {
		try {
			// Check if the user is registered
			if (_msg.from.id == _msg.chat.id || !await this.app.db.db_user_isRegistered(_msg)) { return; }
			else await this.app.db.incrementValue(this.settings.path.db.users + _msg.from.id + this.settings.path.db.user.messages);
			
			// Handle achievements related to messages
			await this.app.achievement.h_messages(_msg);
		} catch (error) {
			this.logger.log(`Error handling normal message: ${error.stack}`, "error");
		}
	}
	
}

module.exports = TGBot;
