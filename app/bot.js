import { Telegraf } from 'telegraf';
import Logger from './logger.js';

export default class TGBot {
	constructor(_settings) {
		this.logger = new Logger();
		this.settings = _settings;
		this.commands = _settings.locale.commands;
		this.run = false;
		this.bot;
		this.commandHandlers = [];	
		this.start();
	}

	async start() {
		// check token
		this.logger.log(this.settings.locale.console.bot_token_verify_start, "info");
		if (!await this.verifyToken(this.settings.token)) {
			this.logger.log(this.settings.locale.console.bot_token_verify_invalid, "error");
			return;
		}

		// create commands
		for (let command in this.settings.locale.commands) {
			if (this.commands.hasOwnProperty(command)) {
				// Remove the slash from the command name
				let functionName = "cmd_" + command.slice(1);

				// Check if a function with this name exists in this class
				if (typeof this[functionName] === 'function'){
					// Bind the function to 'this' and store it along with the command name
					this.commandHandlers.push({command: command, handler: this[functionName].bind(this)});
					this.logger.log(command + this.settings.locale.console.bot_command_created + this[functionName].name, "info");
				} else {
					this.logger.log(command + this.settings.locale.console.bot_command_func_404, "warning");
				}
				
			}
		}
		this.logger.log(`CommandHanlers:\n ${JSON.stringify(this.commandHandlers)}`, "debug");
		this.logger.log('Commands initialized', "info");
		

		// start BOT	
		this.bot = new Telegraf(this.settings.token);		
		this.run = true;

		this.bot.start((ctx) => {
			ctx.reply('Hello, to start using this bot, please register with /go command');
		});

		this.bot.on('text', (ctx) => {
			this.handleMessage(ctx.message);	
		});

		this.bot.launch();
	}

	async stop()
	{
		await this.bot?.stop();
		this.bot = null;
		this.run = false
		return true;
	}

	async verifyToken(token) {		
		// try to connect, if success disconnect and return true, else disconnect return false
		const _tempBot = new Telegraf(token);
		try {
			this.run = true;
			await _tempBot.telegram.getMe();
			_tempBot.stop();
			this.logger.log("Token verified", "info");
			return true;
		} catch (error) {
			if (_tempBot.run) _tempBot.stop();
			this.run = false;
			this.logger.log("Token verification failed", "error");
			return false;
		}
	}

	async sendMessage(chatID, message, replyID) 
	{
		// basic conditions
		if (!message || !chatID) { 
			this.logger.log(bot_message_verify_fail + message + chatID, "error");
			return; 
		}
		// send message to chat
		else if (!replyID) {
			await this.bot.telegram.sendMessage(chatID, message, { parse_mode: 'HTML' })
				.then(() => {
					this.logger.log(this.settings.locale.console.bot_message_send_success + chatID + ": " + message, "info");
				})
				.catch((error) => {
					this.logger.log(this.settings.locale.console.bot_message_send_fail + error, "error");
				});
		} else if (replyID) {
			await this.bot.telegram.sendMessage(chatID, message, { reply_to_message_id: replyID, parse_mode: 'HTML'})
				.then(() => {
					this.logger.log(this.settings.locale.console.bot_message_send_success + chatID + ": " + message, "info");
				})
				.catch((error) => {
					this.logger.log(this.settings.locale.console.bot_message_send_fail + error, "error");
				});
		} else {
			await this.bot.telegram.sendMessage(chatID, message)
				.catch((error) => { 
					this.logger.log(this.settings.locale.console.bot_message_send_fail + error, "error"); 
				});
		}
	}
	

	async handleMessage(msg) {
		// log to console
		this.logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}]: ${msg.text}`);

		// check if message is a command type first and need to be parsed or its  just a normal text message
		if (msg.text.startsWith('/')) {
			this.parseCmd(msg);

		} else {
			// normal message
			this.handleNormalMessage(msg);
		}
	}

	async parseCmd(msg) {	
		let _parsedCommand = await this.sliceBySpace(msg.text); // slice by space
		this.logger.log(`Recieved command: ${_parsedCommand}`, "info");

		if (!_parsedCommand) { this.cmd_incorrect(msg); return;}; // not a valid cmd

		// check if commandHandlers have this command and run associated method
		for (const { command, handler } of this.commandHandlers) {
			this.logger.log(`Checking command ${command}`, "info");
			if (_parsedCommand[0] === command) {
				this.logger.log(`Command ${_parsedCommand[0]} found, calling method`, "info");
				try {
					await handler(msg, _parsedCommand); // Call the method with await
				} catch (err) {
					this.logger.log(err, "error");
				}
				break;
			}
		}
	}

	async sliceBySpace(_text)
	{
		// command is divided by spacce, result is an array
		let command = _text.split(' ');
		for (var key in this.commands) {
			if (key == command[0]) {
				return command;
			}
		}
		return null;
	}

	async cmd_go(_msg)
	{
		this.logger.log(`User ${_msg.from.first_name} ${_msg.from.last_name} wants to go!`, "info");
		this.sendMessage(_msg.chat.id, "Going", _msg.message_id);
	}

	async cmd_incorrect(_msg)
	{
		await this.sendMessage(_msg,  "Incorrect command usage or i'm dead", { reply_to_message_id: _msg.message_id });
	}

}
