/* eslint-disable no-undef */
// #region IMPORTS
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("path");
const ExpressBackend = require("./ExpressBackend.js");
require("bluebird");
require("console");
require("assert-plus");
const readline = require("readline");
const path = require("path");
require("es-abstract/es2019.js");
require("lodash");
require("request");

// #endregion

// #region UTILITY constgants
const colorizeString = (string, color) => { return `${color}${string}${consoleColors.normal}`; };
const _log = (message, logType = "") => {
	const now = new Date();
	const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);
	const logPrefix = logType ? `[${logType}]:` : "";
	console.log(`[${formattedDate}] ${ logPrefix} ${message}`);
};
const logAsBot = (message) => {
	const callerName = new Error().stack.split("\n")[2].trim().split(" ")[1];
	_log(`${callerName}: ${message}`, colorizeString("Bot", consoleColors.bot)); 
};
const logAsApp = (message) => {
	const callerName = new Error().stack.split("\n")[2].trim().split(" ")[1];
	_log(`${callerName}: ${message}`, colorizeString("App", consoleColors.app));
};
const logAsUtility = (message) => _log(message, colorizeString("Utility", consoleColors.utility));
const logAsDebug = (message) => _log(message, colorizeString("Debug", consoleColors.debug));

const consoleColors = {
	"normal": "\x1b[38;5;244m",
	"rare": "\x1b[38;5;21m",
	"epic": "\x1b[38;5;129m",
	"legendary": "\x1b[38;5;226m",
	"info": "\x1b[38;5;46m",
	"error": "\x1b[38;5;196m",
	"debug": "\x1b[38;5;21m",
	"utility": "\x1b[38;5;15m",
	"bot": "\x1b[38;5;201m",
	"app": "\x1b[38;5;100m"
};


//#endregion


// #region CONSTANTS
// Specify the storage folder path
// eslint-disable-next-line no-undef
const storageFolderPath = path.join(__dirname, "storage");

// JSONs and paths
const settingsPath = path.join(storageFolderPath, "settings.json");
// eslint-disable-next-line no-undef
const settingsModel = { "token": process.env.TOKEN || "", "port": process.env.PORT || 3001};
const settings = openOrCreateJSON(settingsPath, settingsModel);

// locale
const localeModel = {
	"base": {
		"register_success": "Welcome"
	},
	"user": {
		"register_success": "🤮🤮🤮\nGG <s>N00B</s>"
	}
};
const localePath = path.join(storageFolderPath, "locale.json");
const localeKeys = openOrCreateJSON(localePath, localeModel);

// suggestion db, stores user suggestions
const suggestionModel = [
	{
		"1234567890": [
			{
				"suggestion": "Pls 1337",
				"time": "2022-01-03T00:00:00Z"
			}
			// More suggestions...
		]
		// More users...
	}
];
const suggestionPath = path.join(storageFolderPath, "suggestion.json");
const suggestions = openOrCreateJSON(suggestionPath, suggestionModel);

const rarityPath = path.join(storageFolderPath, "/rarity.json");
const rarityData = openOrCreateJSON(rarityPath, {
	"normal": {
		"text": "Normal",
		"dropRate": 0.5
	}});

const messageStringsPath = path.join(storageFolderPath, "messageStrings.json");
const messageStrings = openOrCreateJSON(messageStringsPath, 
	{
		"Normal": {
			"open": "",
			"close": ""
		}
	});	

const ppPath = path.join(storageFolderPath, "pp.json");
const ppList = openOrCreateJSON(ppPath, 
	[
		{
			"id": 1337,
			"description": "You are L33T AF!",
			"rarity": "1337"
		}
	]);

const defaultUserPath = path.join(storageFolderPath, "defaultUser.json");
const defaultUser = openOrCreateJSON(defaultUserPath, (
	
	{
		"id": 0,
		"messagesCount": 0,
		"lastPP": 
		{
			"id": 0,
			"time": `${new Date().getTime() - 24 * 60 * 60 * 1000}`
		},
		"collection": 
		{
		}
	}));

const userDatabasePath = path.join(storageFolderPath, "userDatabase.json");
const userDatabase = openOrCreateJSON(userDatabasePath, {
	"users": [
		{
			defaultUser
		}			
	]
});
		
// #endregion



//#region COMMANDS OBJECT
const commands = 
{
	"/me": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get info.`);		
		meCommand(msg);		
	},
	"/pp": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get PP.`);
		ppCommand(msg);		
	},
	"/deleteme": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to unregister.`);
		deletemeCommand(msg);
	},
	"/go": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to register.`);
		goCommand(msg);
	},
	"/commands": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get commands.`);
		sendMessage(msg.chat.id, 
			"Available commands:\n<code>/me</code> - get your info\n<code>/pp</code> - get PP\n<code>/pp 1337</code> - get info about PP\n<code>/deleteme</code> - unregister\n<code>/go</code> - register\n<code>/commands</code> - get commands", msg.message_id);
	},
	"/add": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to suggest.`);
		addCommand(msg);
	},
	"/rar": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get rarities.`);
		rarCommand(msg);
		
	},
	"/a" : (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to use admin command.`);
		aCommand(msg); 
	},
	"/toppp": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get top PP.`);
		topPPCommand(msg);
	},
	"/allpp": (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get all PP.`);
		allPPCommand(msg);
	}
};
//#endregion

// LETS
let bot;
let webBackend;
// eslint-disable-next-line no-undef
let token = process.env.TOKEN || settings.token;

// #region COMMANDS


async function aCommand(msg) {
	let _message = "You are not admin.";
	if (!await isAdmin(msg)) {
		return;
	}

	//const command = parseCommand(msg);
	_message = ("You are admin.");
	sendMessage(msg.chat.id, _message, msg.message_id);
}

async function allPPCommand(msg) {
	let _message = "All PP Here: <a href='https://github.com/diviatrix/PPBot/blob/baza/storage/pp.json'>https://github.com/diviatrix/PPBot/blob/baza/storage/pp.json</a>";
	sendMessage(msg.chat.id, _message, msg.message_id, { parse_mode: "HTML" });
}

async function topPPCommand(msg) {
	// Show top 10 PP of the day
	// scan userDatabase for lastPP.time
	// filter by today
	// sort by lastPP.id
	// send user message with reply: top 10 (or less) PP
	const _today = new Date().toISOString().split("T")[0];
	const _users = userDatabase.users.filter((user) => user.lastPP.time.split("T")[0] == _today);
	const _sorted = _users.sort((a, b) => a.lastPP.id - b.lastPP.id);
	let _message = "Top PP of the day:\n";
	await Promise.all(_sorted.slice(0, 10).sort((a, b) => b.lastPP.id - a.lastPP.id).map(async (user) => { _message += `${user.lastPP.id}\n`; } ));
	sendMessage(msg.chat.id, _message, msg.message_id);
}


// /me command
// shows user info
// usage - /me for self info
// usage - /me number for get count how many users have this PPasync function addCommand(msg) {
async function addCommand(msg) {
	const { args: _suggestion } = parseCommand(msg);
	const { id: _userId } = msg.from;
	let _message;
	if (!_suggestion) { _message = localeKeys.user.suggest_no_args;	} 
	else if (userSubmittedThisSuggestion(_userId, _suggestion)) { _message = localeKeys.user.suggest_already_submitted; } 
	else {
		let data = {
			[_userId]: [
				{
					"suggestion": _suggestion,
					"time": new Date().toISOString()
				}
			]
		};
		logAsDebug(JSON.stringify(data, null, 2));
		suggestions[_userId] = data[_userId];
		
		//writeJSON(suggestionPath, suggestions); 
		_message = localeKeys.user.suggest_success;
	}
	sendMessage(msg.chat.id, _message, msg.message_id);
}

function rarCommand(msg) {
	let _message = "Rarities:";
	// iterate thru rarityData
	for (const _rarity in rarityData) {
		const _mesStr = messageStrings[rarityData[_rarity].text];
		if (_mesStr) { _message += `\n${_mesStr.open}[${_rarity}]${_mesStr.close}`; };
	}
	sendMessage(msg.chat.id, _message, msg.message_id);
}

// /pp command
// shows user PP
// usage - /pp for random PP of the day
// usage - /pp number to get info about this PP
function ppCommand(msg) {
	// get user data
	const user = getUserData(msg.from.id);
	if (!user) { logAsDebug(`User ${msg.from.id} not found in userDatabase.`); return; }

	// we have to already know it is command and command is pp
	// parse it
	const command = parseCommand(msg);

	// if "/pp" no params 
	if (!command.args) { dailyPP(msg); }
	else if (command.args && parseInt(command.args)) { ppInfo(msg, parseInt(command.args)); }
	else if (parseInt(command.args) == 0) { ppInfo(msg, 0); }
	else { sendMessage(
		msg.chat.id, 
		"Incorrect usage or PP doesn't exist in our database\nUse <code>/pp</code> for random PP of the day\n<code>/pp 1337</code> to get info about this PP\n<code>/add 2077</code> to suggest new PP.",
		msg.message_id);}
}

function dailyPP(msg) {	
	// check user _lastPP in database
	const _lastPP = userLastPPReceived(msg.from.id);
	let message;

	readOrFixLastPPTime(msg.from.id);

	if (_lastPP?.id == 0) 
	{
		// send message to user with greets
		_lastPP.time = new Date().setDate(_lastPP.time.getDate() - 1);
		_lastPP.time = _lastPP.time.toISOString();

		sendMessage(msg.chat.id, "Everybody Starts with something..\nWelcome to PP club \u2764", msg.message_id);
	}

	// if user already received PP today
	logAsDebug(canRecieveNewPP(msg.from.id));
	if (!canRecieveNewPP(msg.from.id))
	{
		message = "You already received PP today.\n";
		message += preparePPMessageById(_lastPP.id);
		message += "\n\n<i>Return for next PP Check tomorrow.</i>";
		// send message to user with last pp info
		sendMessage(msg.chat.id, message, msg.message_id);
	}
	else 
	{
		const randomPP = getNewRandomPPForUser(msg.from.id);
		message = `Congratulations!!!\nYou've got ${randomPP.id}\n\n`;
		message += preparePPMessageById(randomPP.id);
		if (!isNaN(addPPToUserCollection(msg.from.id, randomPP.id))) { sendMessage(msg.chat.id, message, msg.message_id);}
	}
}

function ppInfo(msg, PPId) 
{
	let _message = `Information about PP: ${PPId}\n${preparePPMessageById(PPId)}`;
	_message += `\n${userHasPP(msg.from.id, PPId) ? "\nYou <b>have</b> this PP.\n" : "You don't have this PP."}\n`;
	_message += `Total of ${countPPOwners(PPId)} users have this PP.`;
	sendMessage(msg.chat.id, _message, msg.message_id);
}

function goCommand(msg) {
	let _message;	

	// check if registerd already
	if (isRegistered(msg.from.id)) {
		_message = "Forgot you are registered? 😒\nIf you want to unregister - <code>/deleteme</code> 🤮\nAccount will be removed permanently 🤮";
	}
	// register if not
	else {
		writeNewUserToDatabase(msg.from.id);
		_message = "🎆🎆🎆Congratulations!🎆🎆🎆\nNow you can now use\n<code>/commands></code>\n<code>/me</code>, \n<code>/pp</code> \nand <code>/deleteme</code> commands";
	}

	logAsDebug(`[goCommand][${msg.chat.id}][${_message}][${msg.from.id}]`);
	
	sendMessage(msg.chat.id, _message, msg.message_id);
}

function deletemeCommand(msg) {
	logAsApp(`[${msg.from.id}][${msg.from.first_name} ${msg.from.last_name}] is trying to unregister.`);

	if (isRegistered(msg.from.id)) {
		removeUserById(msg.from.id);
		sendMessage(msg.chat.id, "You have been unregistered.", msg.message_id);
	}
}

async function meCommand(msg) {
	const user = await getUserData(msg.from.id);
	if ( !user) { 
		logAsDebug(`User ${msg.from.id} not found in userDatabase.`); 
		return; 
	}
	await checkUserFields(user);

	const ppCount = userPPcount(msg.from.id);
	const suggestionLength = suggestions[msg.from.id] ? suggestions[msg.from.id].length : 0;
	const message = `User: ${msg.from.first_name} ${msg.from.last_name}\nMessages: ${user.messagesCount}\nPP collection: ${ppCount}\nGems: ${user.gemsCount} \nSuggestions: ${suggestionLength}`;
	sendMessage(msg.chat.id, message, msg.message_id);
}

//#endregion

//#region BASIC BOT FUNCTIONS
async function checkUserFields(_user) {
	// if user doesn't have needed fields, create them and save userDatabase
	if (!_user.messagesCount) { _user.messagesCount = 0; }
	if (!_user.collection) { _user.collection = []; }
	if (!_user.gemsCount) { _user.gemsCount = 0; }
	userDatabase.users = userDatabase.users.map(user => user.id === _user.id ? _user : user);
	writeJSON(userDatabasePath, userDatabase);
}

// function to recieve command from user and trigger action
function recieveCommand(msg) 
{
	logAsApp(`Recieved command: ${msg.text}`);

	const recievedCommand = parseCommand(msg);

	if (isValidCommand(recievedCommand.command)) {
		commands[recievedCommand.command](msg);
	}
}

// function to check if message is command
function isCommand(msg) {
	if (!msg.text) { return false; }
	return msg.text.startsWith("/");
}

function isValidCommand(parsedCommand) {
	const result = Object.keys(commands).some((command) => command == parsedCommand);
	logAsDebug(`Checking if command is valid: ${parsedCommand}: ${result}`);
	return result;
}

// function to parse command
function parseCommand(msg) 
{
	const command = msg.text.split(/[@\s]/)[0];
	const args = msg.text.split(/[@\s]/).slice(1).join(" ");
	logAsDebug(`Parsed command: ${command} ${args}`);
	return { command, args };
}

async function sendMessage(chatID, message, replyID) 
{
	// get caller for debug
	const callerName = new Error().stack.split("\n")[2].trim().split(" ")[1];
	// basic conditions
	if (!message || !chatID) { 
		logAsDebug(`[${callerName}] sendMessage: message or chatID is undefined: ${message} ${chatID}`);
		return; 
	}
	// send message to chat
	else if (!replyID) {
		bot.sendMessage(chatID, message, { parse_mode: "HTML" })
			.then(() => {
				logAsBot(`Sent message to chat -> ${chatID}: ${message}`);
			})
			.catch((error) => {
				logAsBot(`[${callerName}] sendMessage: ${error}`);
			});
	} else if (replyID) {
		bot.sendMessage(chatID, message, { reply_to_message_id: replyID, parse_mode: "HTML"})
			.then(() => {
				logAsBot(`Sent message to chat -> ${chatID}: ${message}`);
			})
			.catch((error) => {
				logAsBot(`[${callerName}] sendMessage: ${error}`);
			});
	} else {
		bot.sendMessage(chatID, message)
			.catch((error) => { 
				logAsBot(`[${callerName}] sendMessage: ${error}`); 
			});
	}
}
//#endregion

//#region LOAD SAVE JSON FUNCTIONS
// function to open or create json file by provided path and data
// return result
function openOrCreateJSON(filePath, data) {
	if (data === undefined) { data = {}; }
	if (!pathExist(filePath)) { 
		writeJSON(filePath, data); 
		logAsUtility(`Can't find ${filePath} -> created empty.`); 
	}

	return JSON.parse(fs.readFileSync(filePath));
}
function writeJSON(filePath, data) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		logAsUtility(`${filePath} saved.`);
		return true;
	} catch (error) {
		console.error(`Error writing file at ${filePath}: ${error}`);
	}
}


// function to check if file exist by provided path
function pathExist(filePath) { return fs.existsSync(filePath); }



function writeSettings() {
	writeJSON(settingsPath, { "token": token });
}

//#endregion

//#region ACCOUNT FUNCTIONS
function isRegistered(userId) {
	if (!userDatabase) { return false; }
	return userDatabase.users.some((user) => user.id === userId);
}

// function to add message counter ++ by user id
function addMessageCountByUserId(userId) {
	getUserData(userId).messagesCount++;
	writeJSON(userDatabasePath, userDatabase);
}

function removeUserById(userId) {
	const userIndex = userDatabase.users.findIndex((user) => user.id === userId);
	if (userIndex === -1) { return; }
	userDatabase.users.splice(userIndex, 1);
	writeJSON(userDatabasePath, userDatabase);
}

function userSubmittedThisSuggestion(_userId, _suggestion) {
	const _userSuggestions = suggestions[_userId];
	if (!_userSuggestions || !Array.isArray(_userSuggestions)) { suggestions[_userId] = []; return false; }
	if (_userSuggestions.some((suggestion) => suggestion.suggestion === _suggestion)) { return true; }
	return false;
}

function getUserData(userId) {
	return userDatabase.users.find((user) => user.id === userId);
}

// function to write new user (id) to userDatabase
function writeNewUserToDatabase(userId) 
{
	let newUser = defaultUser;
	newUser.id = userId;

	userDatabase.users.push(newUser);
	
	// save userDatabase to file
	writeJSON(userDatabasePath, userDatabase);
	logAsApp(`New user [${userId}] added to userDatabase.`);
}



// #endregion

// #region PP FUNCTIONS

// prepare string to message about pp by id
// [Rarity][Number] Description
function preparePPMessageById(PPId) {
	const PP = getPPbyID(PPId);
	if (!PP) { logAsApp(`PPID: ${PPId}, failed to get getPPbyID`); return; }

	const mesStr = messageStrings[rarityData[PP.rarity].text];
	if (!mesStr) { logAsApp(`PPID: ${PPId}, failed to get message rarity strings: ${JSON.stringify(PP.rarity, null, 2)}, ${JSON.stringify(messageStrings, null, 2)}`); return; }

	let message;
	
	if (PP && PP.rarity && rarityData[PP.rarity]) { message = `${mesStr.open}[${PP.rarity}][${PP.id}][${PP.description}]${mesStr.close}`; } 
	else { logAsApp("PP or PP.rarity is undefined, or rarityData[PP.rarity] does not exist"); }

	if (!message) message = `Fix me: ${this.name} function.`;

	return message;
}



function readOrFixLastPPTime(userId) {
	const fixedPPtime = new Date().setDate(-1).toString();
	const user = getUserData(userId);
	if (!user) { return; }
	
	if (!user.lastPP.time) { user.lastPP.time = fixedPPtime; } // if no value
	else if (typeof user.lastPP.time !== "string") { user.lastPP.time = fixedPPtime; } // if not string
	else if (isNaN(new Date(user.lastPP.time))) { user.lastPP.time = fixedPPtime; } // if not ISO date string

	writeJSON(userDatabasePath, userDatabase);

	return user.lastPP.time;
}


// if user has PP by id, search in userDatabase, return bool
function userHasPP(userId, PPId) {
	const user = getUserData(userId);
	if (!user) { return; }
	if (Array.isArray(user.collection) && user.collection.some((PP) => PP.id === PPId)) { return true; }
	return false;
}

function userLastPPReceived(userId) {
	const user = getUserData(userId);
	if (!user) { return; }
	return user.lastPP;
}

// check if can recieve new PP
// if lastPP.time is not ISO string, return true
// else if lastPP.time + timeout_pp is less than now, return true
// else return false
function canRecieveNewPP(userId) {
	const user = getUserData(userId);
	const lastPP = readOrFixLastPPTime(userId);
	if (!user) { return false; }
	if (new Date(lastPP).getTime() < new Date().setHours(0, 0, 0, 0)) { return true; }
	return false;
}

// count number of PP owners in userDatabase
function countPPOwners(PPId) {
	if (!userDatabase) { return 0; }
	return userDatabase.users.filter((user) => Array.isArray(user.collection) && user.collection.some((PP) => PP.id === PPId)).length;
}

// function to add PP to user (id) in userDatabase with all checks
function addPPToUserCollection(userId, PPId) {
	// add PP to user in userDatabase
	const user = getUserData(userId);

	// if no user - ret
	if (!user) { return; }

	// if no collection - create
	if (!user.collection) { user.collection = []; }
	if (!Array.isArray(user.collection)) { user.collection = []; } // Ensure user.collection is an array

	// if user has PP - add +1 to pp count
	if (userHasPP(userId, PPId)) {
		// add +1 to pp count
		getUserData(userId).collection.find((PP) => PP.id === PPId).count++;
		return;
	}

	user.collection.push({ "id": PPId, "time": new Date() });
	user.lastPP = { "id": PPId, "time": new Date().toISOString() };
	writeJSON(userDatabasePath, userDatabase);
	
	return user.lastPP;
}

function getPPbyID(PPId) 
{
	const PP = ppList.find((PP) => PP.id === PPId);
	if (!PP) { logAsApp(`Tried to get PP by id: ${PPId}, but failed`); }
	return PP;
}

function userPPcount(userID)
{
	let count = 0;
	const user = getUserData(userID);
	if (!user.collection) { return count; }

	count = user.collection.length;
	
	return count;
}

function getNewRandomPPForUser(userId) {
	let randomPP;

	randomPP = generateRandomPP();

	while (userHasPP(userId, randomPP.id))
	{
		randomPP = generateRandomPP();
	}

	return randomPP;
}

function generateRandomPP() {
	if (!ppList) { return logAsApp("Tried to take ppList but failed, cant generate."); }
	const randomPP = ppList[Math.floor(Math.random() * ppList.length)];
	return randomPP;
}
// #endregion



// #region STARTUP
async function startup() {
    
	// Check if token exists and request from user
	await checkToken();

	// Create a new instance of the Telegram bot
	bot = new TelegramBot(token, { polling: true });

	// Start web backend
	webBackend = new ExpressBackend();

	bot.on("message", (msg) => {
		//logAsBot(JSON.stringify(msg, null, 2));
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}]: ${msg.text}`);

		// check if message is command "/"
		if (isCommand(msg)) {
			recieveCommand(msg);
		}
		// or check if user registered and add to variables 
		else if (isRegistered(msg.from.id)) {
			// add +1 to user message counter
			if(msg.text) addMessageCountByUserId(msg.from.id);
		}

		return;
	});

	bot.on("polling_error", (error) => {
		logAsBot(`Polling error: ${JSON.stringify(error)}`);
		if (error.stack) {
			logAsBot(`Error stack: ${error.stack}`);
		}
	});

	// bot handle message /commands@botname where botname is bot username
	bot.onText(/\/commands@(\w+)/, (msg, match) => { 
		if (match == bot.getMe().username) {
			recieveCommand(msg);
		}
	});
	

	webBackend.start();
}

async function checkToken() {
	if (!token) {
		logAsApp(`Token not found. Please put it to ${settingsPath} with your token or input now:`);

		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		token = await new Promise(resolve => {
			rl.question("Please enter your bot token from @botfather: ", (input) => {
				rl.close();
				resolve(input);
			});
		});
		if (token) { writeSettings(); }
	}
}

// check if sender id == in settings.admin, return result
async function isAdmin(mes)
{
	const _id = mes.from.id;
	const _admin = settings.admin;
	const _result = _id == _admin;
	logAsDebug(`isAdmin: ${JSON.stringify( _id, null, 2)} == ${_admin}: ${_result}`);
	return (_result);
}

// run initial function to create all objects and setup them
startup();

// #endregion