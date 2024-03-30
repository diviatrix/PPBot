import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
//import { ExpressBackend } from "./ExpressBackend.js";
import { Logger } from "./logger.js";
import process from "process";
process.noDeprecation = true;

const logger = new Logger("info", "error", "warning");
const storageFolderPath = path.join(path.resolve(),"src", "storage");
const settingsPath = path.join(storageFolderPath, "settings.json");
const settings = openOrCreateJSON(settingsPath, { "token": process.env.TOKEN || "", "port": process.env.PORT || 3001});
const ppList = openOrCreateJSON(path.join(storageFolderPath, "pp.json"), []);
const userDatabasePath = path.join(storageFolderPath, "userDatabase.json");
const userDatabase = openOrCreateJSON(userDatabasePath, { "users": [] });
const commands = 
{
	"/me": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get info.`, "info");		
		meCommand(msg);		
	},
	"/pp": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get PP.`);
		ppCommand(msg);		
	},
	"/deleteme": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to unregister.`);
		deletemeCommand(msg);
	},
	"/go": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to register.`);
		goCommand(msg);
	},
	"/commands": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get commands.`);
		sendMessage(msg.chat.id, 
			"Available commands:\n<code>/me</code> - get your info\n<code>/pp</code> - get PP\n<code>/pp 1337</code> - get info about PP\n<code>/deleteme</code> - unregister\n<code>/go</code> - register\n<code>/commands</code> - get commands", msg.message_id);
	},
	"/rar": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get rarities.`);
		rarCommand(msg);
	},
	"/a" : (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to use admin command.`);
		aCommand(msg); 
	},
	"/toppp": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get top PP.`);
		topPPCommand(msg);
	},
	"/allpp": (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get all PP.`);
		allPPCommand(msg);
	}
};

let bot;
//let webBackend = new ExpressBackend();
// eslint-disable-next-line no-undef
let token = process.env.TOKEN || settings.token;

async function aCommand(msg) {
	let _message = "You are not admin.";
	if (!await isAdmin(msg)) { return; }
	_message = ("You are admin.");
	sendMessage(msg.chat.id, _message, msg.message_id);
}

async function allPPCommand(msg) {
	let _message = "All PP Here: <a href='https://github.com/diviatrix/PPBot/blob/baza/src/storage/pp.json'>https://github.com/diviatrix/PPBot/blob/baza/src/storage/pp.json</a>";
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

function rarCommand(msg) {
	let _message = "Rarities:";
	// iterate thru rarityData
	for (const _rarity in settings.rarity) {
		const _mesStr = settings.messageStrings[settings.rarity[_rarity].text];
		if (_mesStr) { _message += `\n${_mesStr.open}[${_rarity}]${_mesStr.close}`; }
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
	if (!user) { logger.log(`User ${msg.from.id} not found in userDatabase.`); return; }

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

	if (!_lastPP?.id) 
	{
		// send message to user with greets
		//_lastPP.time = new Date().setDate(_lastPP.time.getDate() - 1);
		const date = new Date();
		date.setDate(date.getDate() - 1);
		_lastPP.time = date.toISOString();

		sendMessage(msg.chat.id, "Everybody Starts with something..\nWelcome to PP club \u2764", msg.message_id);
	}

	// if user already received PP today
	logger.log(canRecieveNewPP(msg.from.id));
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
		message = `Congratulations! You've got ${randomPP.id}\n`;
		message += preparePPMessageById(randomPP.id);
		if (isNaN(addPPToUserCollection(msg.from.id, randomPP.id))) { sendMessage(msg.chat.id, message, msg.message_id);}
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

	logger.log(`[goCommand][${msg.chat.id}][${_message}][${msg.from.id}]`);
	
	sendMessage(msg.chat.id, _message, msg.message_id);
}

function deletemeCommand(msg) {
	logger.log(`[${msg.from.id}][${msg.from.first_name} ${msg.from.last_name}] is trying to unregister.`);

	if (isRegistered(msg.from.id)) {
		removeUserById(msg.from.id);
		sendMessage(msg.chat.id, "You have been unregistered.", msg.message_id);
	}
}

async function meCommand(msg) {
	const user = await getUserData(msg.from.id);
	if ( !user) { 
		logger.log(`User ${msg.from.id} not found in userDatabase.`); 
		return; 
	}
	await checkUserFields(user);

	const ppCount = userPPcount(msg.from.id);
	const message = `User: ${msg.from.first_name} ${msg.from.last_name}\nMessages: ${user.messagesCount}\nPP collection: ${ppCount}\nGems: ${user.gemsCount}`;
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
	logger.log(`Recieved command: ${msg.text}`);

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
	logger.log(`Checking if command is valid: ${parsedCommand}: ${result}`);
	return result;
}

// function to parse command
function parseCommand(msg) 
{
	const command = msg.text.split(/[@\s]/)[0];
	const args = msg.text.split(/[@\s]/).slice(1).join(" ");
	logger.log(`Parsed command: ${command} ${args}`);
	return { command, args };
}

async function sendMessage(chatID, message, replyID) 
{
	// get caller for debug
	const callerName = new Error().stack.split("\n")[2].trim().split(" ")[1];
	// basic conditions
	if (!message || !chatID) { 
		logger.log(`[${callerName}] sendMessage: message or chatID is undefined: ${message} ${chatID}`);
		return; 
	}
	// send message to chat
	else if (!replyID) {
		bot.sendMessage(chatID, message, { parse_mode: "HTML" })
			.then(() => {
				logger.log(`Sent message to chat -> ${chatID}: ${message},`);
			})
			.catch((error) => {
				logger.log(`[${callerName}] sendMessage: ${error}`);
			});
	} else if (replyID) {
		bot.sendMessage(chatID, message, { reply_to_message_id: replyID, parse_mode: "HTML"})
			.then(() => {
				logger.log(`Sent message to chat -> ${chatID}: ${message} : ${replyID}`);
			})
			.catch((error) => {
				logger.log(`[${callerName}] sendMessage: ${error}`);
			});
	} else {
		bot.sendMessage(chatID, message)
			.catch((error) => { 
				logger.log(`[${callerName}] sendMessage: ${error}`); 
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
		logger.log(`Can't find ${filePath} -> created empty.`); 
	}

	return JSON.parse(fs.readFileSync(filePath));
}
function writeJSON(filePath, data) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		logger.log(`${filePath} saved.`);
		return true;
	} catch (error) {
		console.error(`Error writing file at ${filePath}: ${error}`);
	}
}

function pathExist(filePath) { return fs.existsSync(filePath); }

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


function getUserData(userId) {
	return userDatabase.users.find((user) => user.id === userId);
}

// function to write new user (id) to userDatabase
function writeNewUserToDatabase(userId) 
{
	let newUser = settings.defaultUser;
	newUser.id = userId;

	userDatabase.users.push(newUser);
	
	// save userDatabase to file
	writeJSON(userDatabasePath, userDatabase);
	logger.log(`New user [${userId}] added to userDatabase.`);
}

function preparePPMessageById(PPId) {
	const PP = getPPbyID(PPId);
	if (!PP) { logger.log(`PPID: ${PPId}, failed to get getPPbyID`); return; }

	const mesStr = settings.messageStrings[settings.rarity[PP.rarity].text];
	if (!mesStr) { logger.log(`PPID: ${PPId}, failed to get message rarity strings: ${JSON.stringify(PP.rarity, null, 2)}, ${JSON.stringify(settings.messageStrings, null, 2)}`); return; }

	let message;
	
	if (PP && PP.rarity && settings.rarity[PP.rarity]) { message = `${mesStr.open}[${PP.rarity}][${PP.id}][${PP.description}]${mesStr.close}`; } 
	else { logger.log("PP or PP.rarity is undefined, or rarityData[PP.rarity] does not exist"); }

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

function canRecieveNewPP(userId) {
	const user = getUserData(userId);
	const lastPP = readOrFixLastPPTime(userId);
	if (!user) { return false; }
	if (new Date(lastPP) < new Date().setHours(0, 0, 0, 0)) { return true; }
	return false;
}

function countPPOwners(PPId) {
	if (!userDatabase) { return 0; }
	return userDatabase.users.filter((user) => Array.isArray(user.collection) && user.collection.some((PP) => PP.id === PPId)).length;
}

function addPPToUserCollection(userId, PPId) {
	const user = getUserData(userId);
	if (!user) { return; }
	if (!user.collection) { user.collection = []; }
	if (!Array.isArray(user.collection)) { user.collection = []; } // Ensure user.collection is an array
	if (userHasPP(userId, PPId)) {
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
	if (!PP) { logger.log(`Tried to get PP by id: ${PPId}, but failed`); }
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
	if (!ppList) { return logger.log("Tried to take ppList but failed, cant generate."); }
	const randomPP = ppList[Math.floor(Math.random() * ppList.length)];
	return randomPP;
}

async function startup() {
	bot = new TelegramBot(token, { polling: true });
	//webBackend.start();

	bot.on("text", (msg) => {
		logger.log(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}]: ${msg.text}`);
		if (isCommand(msg)) { recieveCommand(msg); }
		else if (isRegistered(msg.from.id)) { addMessageCountByUserId(msg.from.id); }

		return;
	});

	bot.on("polling_error", (error) => {
		logger.log(`Polling error: ${JSON.stringify(error)}`);
		if (error.stack) {
			logger.log(`Error stack: ${error.stack}`);
		}
	});

	bot.onText(/\/commands@(\w+)/, (msg, match) => { 
		if (match == bot.getMe().username) {
			recieveCommand(msg);
		}
	});
}

async function isAdmin(mes)
{
	const _id = mes.from.id;
	const _admin = settings.admin;
	const _result = _id == _admin;
	logger.log(`isAdmin: ${JSON.stringify( _id, null, 2)} == ${_admin}: ${_result}`);
	return (_result);
}

startup();
