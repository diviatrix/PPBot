const path = require('path');
const C_ROLL = require(path.join(__dirname, 'cmd', 'cmd_roll.js'));
const C_TOP = require(path.join(__dirname, 'cmd', 'cmd_top.js'));
const C_ME = require(path.join(__dirname, 'cmd', 'cmd_me.js'));
const C_RAR = require(path.join(__dirname, 'cmd', 'cmd_rar.js'));
const C_BONUS = require(path.join(__dirname, 'cmd', 'cmd_bonus.js'));
const C_A = require(path.join(__dirname, 'cmd', 'cmd_a.js'));
const C_AI = require(path.join(__dirname, 'cmd', 'cmd_ai.js'));
const C_PVP = require(path.join(__dirname, 'cmd', 'cmd_pvp.js'));
const C_NOPVP = require(path.join(__dirname, 'cmd', 'cmd_nopvp.js'));
const C_GO = require(path.join(__dirname, 'cmd', 'cmd_go.js'));
const C_DELETEME = require(path.join(__dirname, 'cmd', 'cmd_deleteme.js'));
let APP;

module.exports = class COMMANDS {
	constructor(_app) {
		APP = _app;
		this.commands = _app.SETTINGS.locale.commands;
		this.commandHandlers = [];
		this.attach_cmd_handlers();
		APP.LOGGER.log("Commands constructed", "info");
	}	

	async msg_notRegistered(_msg) { await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.BOT_cmd_requirement_register, _msg.message_id); }
	
	async attach_cmd_handlers()
	{
		let functionName;
		for (let command in APP.SETTINGS.locale.commands) {
			if (Object.prototype.hasOwnProperty.call(this.commands, command)) {
				// Remove the slash from the command name
				functionName = "cmd_" + command.slice(1);

				// Check if a function with this name exists in this class
				if (typeof this[functionName] === 'function'){
					// Bind the function to 'this' and store it along with the command name
					this.commandHandlers.push({command: command, handler: this[functionName].bind(this)});
					APP.LOGGER.log(command + " command created with function:" + this[functionName].name, "info");
				} else { APP.LOGGER.log(command + " does not have an associated function.", "warning"); }				
			}
		}

		APP.LOGGER.log(`CommandHanlers:\n ${JSON.stringify(this.commandHandlers)}`, "debug");
		APP.LOGGER.log('Commands initialized', "info");
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
			APP.LOGGER.log(`Error executing command ${commandText}: ${error.stack}`, "error");
		}
	}

	async cmd_go(_msg) {
		try {
			if (await new C_GO(APP).run(_msg)) return true;
			else return false;
			
		} catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_go: ${error.stack}`, "error");
			return false;
		}		
	}

	async cmd_add(_msg, _params) {
		if (!_params) return APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_add_fail_empty, _msg.message_id);

		if (!await APP.DB.exist(APP.APP.SETTINGS.path.db.users + _msg.from.id)) {
			this.msg_notRegistered(_msg);
			return;
		}

		APP.LOGGER.log(JSON.stringify(_params), "info");
		// adds suggestion to database as new record in  _app.DB
		let record = {
			chatId: _msg.chat.id || _msg.from.id,
			msgId: _msg.message_id || 0,
			text: String(_params) || "",
			time: APP.DB.time(),
			userId: _msg.from.id || 0,
			name: _msg.from.first_name || "" + _msg.from.last_name || ""
		}
		await APP.DB.push(APP.SETTINGS.path.db.suggestions, record);
		APP.LOGGER.log("Suggestion written to database:" + record, "debug");

		await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_add_pass, _msg.message_id);
		return record;
		// adds record about last suggestion to account stats database		
	}

	async cmd_me(_msg) 
	{
		try {
			if (await new C_ME(APP).run(_msg)){return true}
			else { 				
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_me: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_rar(_msg) {
		try {
			if (await new C_RAR(APP).run(_msg)){return true}
			else { 
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_rar: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_ai(_msg, params) {
		try {
			if (await new C_AI(APP).run(_msg, String(params))){return true}
			else { 
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_g: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_a(_msg) {
		try {
			if (await new C_A(APP).run(_msg)){return true}
			else { 
				return false;
			}		
		} catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_a: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_start(_msg){
		await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_start, _msg.message_id);	
	}

	async cmd_roll(_msg) {
		try {
			await new C_ROLL(APP).run(_msg);
			return true;
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}

	// todo : move commands methods to command.js, load commands there also
	async cmd_deleteme(_msg) {
		try {
			await new C_DELETEME(APP).run(_msg);
			return true;
		}
		catch (error) {
			this.cmd_incorrect(_msg);
			APP.LOGGER.log(`Error executing cmd_deleteme: ${error.stack}`, "error");
			return false;
		}
		
	}

	async cmd_incorrect(_msg) { APP.LOGGER.log(`[${_msg.chat.id}][${_msg.message_id}]: Failed to execute command: ${_msg.text}`, "warning"); }
	async cmd_commands(_msg) {
		if (!await APP.DB.exist(APP.SETTINGS.path.db.users + _msg.from.id)) { APP.LOGGER.log("User have to be registered to use: " + _msg.text, "info");  return; }
		let message = APP.SETTINGS.locale.base.BOT_cmd_commands + "\n";
		for (const { command } of this.commandHandlers) { message += command + "\n"; }
		await APP.BOT.sendMessage(_msg.chat.id, message, _msg.message_id);
		APP.LOGGER.log("List of all commands: ", "info");
	}

	async cmd_top(_msg, _params)
	{
		try {
			if (await new C_TOP(APP).run(_msg, _params || [])){return true}
			else { 
				APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_top_fail, _msg.message_id);
				return false;
			}		
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_top: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_pvp(_msg)
	{
		try {
			if (await new C_PVP(APP).run(_msg)){return true}
			else { 
				this.cmd_incorrect(_msg);
				return false;
			}		
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_pvp: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_nopvp(_msg)
	{
		try {
			if (await new C_NOPVP(APP).run(_msg)){return true}
			else { 
				this.cmd_incorrect(_msg);
				return false;
			}		
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_nopvp: ${error.stack}`, "error");
			return false;
		}
	}

	async cmd_bonus(_msg, _params)
	{
		try {
			if (await new C_BONUS(APP).run(_msg, _params || [])){return true}
			else { 
				this.cmd_incorrect(_msg);
				return false;
			}		
		} catch (error) {
			APP.LOGGER.log(`Error executing cmd_roll: ${error.stack}`, "error");
			return false;
		}
	}
}