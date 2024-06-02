const TelegramBot = require('node-telegram-bot-api');
class BOT {
	constructor(_app) {
		this.app = _app;
		this.logger = _app.logger;
		this.SETTINGS = _app.SETTINGS;		
		this.commands = _app.commands;
		this.bot;
		this.username;
		this.start();
		this.logger.log('Bot constructed', "info");
	}

	async start() {
		await this.token_verify();
		await this.bot_start();
		this.logger.log('Bot started', "info");
	}

	async bot_start() {
		// start BOT	
		if (!this.bot) this.bot = new TelegramBot(this.SETTINGS.token);		

		this.bot.on('text', (msg) => { this.handleMessage(msg);	});
		await this.bot.startPolling();
		await this.bot.getMe().then(botInfo => {
			this.username = botInfo.username;
		});
	}

	async token_verify() {
		if(this.SETTINGS.verifyToken)
		{
			this.logger.log(this.SETTINGS.locale.console.bot_token_verify_start, "info");

			if (!await this.token_verify_connect(this.SETTINGS.token)) { this.logger.log(this.SETTINGS.locale.console.bot_token_verify_fail, "error"); return false; }
			else { this.logger.log(this.SETTINGS.locale.console.bot_token_verify_pass, "info"); return true;	}
		}
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
			this.logger.log(this.SETTINGS.locale.console.bot_token_verify_pass, "info");
			return true;
		} catch (error) {
			if (this.bot.isPolling()) this.bot.stopPolling();
			this.logger.log(this.SETTINGS.locale.console.bot_token_verify_fail + error, "error");
			return false;
		}
	}

		/**
		 * Sends a message to a specified chat.		 *
		 * @param {string} chatID - The ID of the chat to send the message to.
		 * @param {string} message - The message to send.
		 * @param {number} [replyID] - The ID of the message to reply to (optional).
		 * @return {Promise<void>} - A promise that resolves when the message is sent successfully.
		 * @throws {Error} - If the message or chatID is not provided, or if there is an error sending the message.
		 */
	async sendMessage(chatID, message, replyID) {
		try {
			if (!message || !chatID) { this.logger.log(this.SETTINGS.locale.console.bot_msg_verify_fail + `Message: ${message}, Chat ID: ${chatID}`, "error"); return; }
		
			const options = replyID ? { reply_to_message_id: replyID, parse_mode: 'HTML' } : { parse_mode: 'HTML' };
			await this.bot.sendMessage(chatID, message, options);

			this.logger.log(this.SETTINGS.locale.console.bot_msg_send_pass + `Chat ID: ${chatID}, Message: ${message}`, "info");
		} 
		catch (error) { this.logger.log(this.SETTINGS.locale.console.bot_msg_send_fail + `Error: ${error.message}, Stack: ${error.stack}`, "error");	}
	}	

	async handleMessage(msg) {
		// if chat is not private or not from the bot itself, check if chat is in chatId whitelist
		if (!this.whitelist_check(msg)) { return; }
		
		this.logger.log(`[${msg.chat.id}][${msg.from.id}][${msg.from.username}][${msg.from.first_name} ${msg.from.last_name}]: ${msg.text}`, "info");

		if (msg.text.startsWith('/') && msg.text.length > 1) {	this.commands.parseCmd(msg);	} 
		else { this.handleNormalMessage(msg); }
	}

	async whitelist_check(msg){
		if (msg.chat.id != msg.from.id && !this.SETTINGS.chatId.includes(msg.chat.id)) {
			this.logger.log("Message from : [" + msg.from.id + "][" + msg.chat.id + "] is not from allowed chat list", "warning"); 
			return; 
		}
	}
	async handleNormalMessage(msg) {
		try {
			// Check if the user is registered
			if (msg.from.id == msg.chat.id || !await this.app.db.exist(this.app.SETTINGS.path.db.users + msg.from.id) ) { return; }
			else await this.app.db.increment(this.SETTINGS.path.db.users + msg.from.id + this.SETTINGS.path.db.user.messages);
			
			// Handle achievements related to messages
			await this.app.achievement.h_messages(msg);
		} catch (error) {
			this.logger.log(`Error handling normal message: ${error.stack}`, "error");
		}
	}
	
}

module.exports = BOT;
