// #region IMPORTS
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const timeout_pp = 24 * 60 * 60 * 1000; // first number is hours
const ExpressBackend = require('./ExpressBackend.js');
const { is } = require('bluebird');
const { log } = require('console');
const ms = require('ms');
const { string } = require('assert-plus');
const readline = require('readline');

// #endregion

//#region UTILITY constgants
const colorizeString = (string, color) => { return `${color}${string}${consoleColors.normal}`; };
const _log = (message, logType = '') => {
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const logPrefix = logType ? `[${logType}]:` : '';
    console.log(`[${formattedDate}] ${ logPrefix} ${message}`);
};
const logAsBot = (message) => {
	const callerName = new Error().stack.split('\n')[2].trim().split(' ')[1];
	_log(`${callerName}: ${message}`, colorizeString('Bot', consoleColors.bot)); 
};
const logAsUser = (msg, message) => _log(`${msg.from.name}: ${message}`);
const logAsApp = (message) => {
	const callerName = new Error().stack.split('\n')[2].trim().split(' ')[1];
	_log(`${callerName}: ${message}`, colorizeString('App', consoleColors.app));
};
const logAsUtility = (message) => _log(message, colorizeString('Utility', consoleColors.utility));
const logAsDebug = (message) => _log(message, colorizeString('Debug', consoleColors.debug));

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
const storageFolderPath = path.join(__dirname, '/storage');
const publicFolderPath = '/public';

// JSONs and paths
const tokenPath = path.join(storageFolderPath, 'token.json');

const rarityPath = path.join(storageFolderPath, '/rarity.json');
const rarityData = openOrCreateJSON(rarityPath, {
	"normal": {
		"text": "Normal",
		"dropRate": 0.5
	}});

const messageStringsPath = path.join(storageFolderPath, 'messageStrings.json');
const messageStrings = openOrCreateJSON(messageStringsPath, 
	{
		"normal": {
			"open": "",
			"close": ""
		}
	});	

const ppPath = path.join(storageFolderPath, 'pp.json');
const ppList = openOrCreateJSON(ppPath, 
	[
		{
			"id": 1337,
			"description": "You are L33T AF!",
			"rarity": "1337"
		}
	]);

const defaultUserPath = path.join(storageFolderPath, 'defaultUser.json');
const defaultUser = openOrCreateJSON(defaultUserPath, [
	0,
	{
		"lastPP": 
		{
			"id": 0,
			"time": ""
		},
		"collection": 
		{
			"pp": {
				"id": 0,
				"time": ""
			},
			"pp2": {
				"id": 0,
				"time": ""
			}
		}
	}
]);

const userDatabasePath = path.join(storageFolderPath, 'userDatabase.json');
const userDatabase = openOrCreateJSON(userDatabasePath, {
	 "users": [
		{
			"id" : 1337,
			"messagesCount": 0,
			"lastPP": {
				"id": 0,
				"time": ""
			},
			"collection": {
				"pp": {
					"id": 0,
					"time": ""
				},
				"pp2": {
					"id": 0,
					"time": ""
				}
			}
		}			
	]
});

const coloredString = (string, color) => {
	return `\x1b[${color}m${string}\x1b[0m`;
};
		
// #endregion



//#region COMMANDS OBJECT
const commands = 
	{
	'/info': (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get info.`);		
		infoCommand(msg);		
	},
	'/pp': (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to get PP.`);
		ppCommand(msg);		
	},
	'/deleteme': (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to unregister.`);
		stopCommand(msg);
	},
	'/go': (msg) => {
		logAsBot(`[${msg.from.first_name} ${msg.from.last_name}][${msg.from.id}] is trying to register.`);
		goCommand(msg);
	}
};
//#endregion

// LETS
let bot;
let webBackend;
let token = openOrCreateJSON(tokenPath, { "token" : '' }).token;

// #region COMMANDS

// /info command
// shows user info
// usage - /info for self info
// usage - /info number for get count how many users have this PP
function infoCommand(msg) {
	const input = parseCommand(msg);
	let message;

	const userData = getUserData(msg.from.id);
	if (!userData) { return; }

	const userPPs = userPPcount(msg.from.id);
	const messageCount = userData.messagesCount;
	const lastPP = userData.lastPP.id;
	const lastPPTime = userData.lastPP.time;

	// self info
	if (!input.args) { message = `You have sent ${messageCount} messages. Your last PP was ${lastPP} at ${lastPPTime}. You have total of ${userPPs} PPs.`; }
	else if (parseInt(args[1])) {
		const PPId = parseInt(args[1]);
		const count = countPPOwners(PPId);
		message =  `There are ${count} Dudes who have ${PPId}.`;
	}
	else {
		message = 'Incorrect usage. Use /info for self info, /info @username for user info or /info number for get count how many users have this PP.';
	}
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
	if (!command.args) 
	{
		dailyPP(msg);
	}
	// check if args exist 
	else if (command.args && parseInt(command.args))
	{
		ppInfo(msg, parseInt(command.args));
	}
	else 
	{
		sendMessage(msg.chat.id, 'Incorrect usage. Use /pp for random PP of the day, /pp number to get info about this PP.', msg.message_id);
	}
}

function dailyPP(msg) {	
	// check user _lastPP in database
	const _lastPP = userLastPPReceived(msg.from.id);

	if (_lastPP) 
	{
		// send message to user with greets
		sendMessage(msg.chat.id, `This is Your first PP!  Congratulations!!!`, msg.message_id);
		user.lastPP = { "id": 0, "time": new Date(new Date() - timeout_pp) };
	}
	else if (new Date() - _lastPP.time + timeout_pp > 0)
	{
		// send message to user with last pp info
		sendMessage(msg.chat.id, preparePPMessageById(_lastPP.id), msg.message_id);
	}

	if (new Date() - _lastPP.time + timeout_pp > 0)
	{
		message = `You already received PP today. Time left: ${timeUntilNextPossiblePPGet(msg.from.id)}.`;
	}
	
	// if not - randomize new
	else 
	{
		const randomPP = getNewRandomPPForUser(msg.from.id);
		message = `You got ${randomPP.id}.`;
		addPPToUserCollection(msg.from.id, randomPP.id);
	}
}

function ppInfo(msg, PPId) 
{
	const message = preparePPMessageById(PPId);
	sendMessage(msg.chat.id, message, msg.message_id);
}




function goCommand(msg) {
	let message;	

	// check if registerd already
	if (isRegistered(msg.from.id)) {
		message = 'You are already registered.';
	}
	// register if not
	else {
		writeNewUserToDatabase(msg.from.id);
		message = 'You have been registered as THE DUDE.';
	}

	logAsDebug(`[goCommand][${msg.chat.id}][${message}][${msg.from.id}]`);
	
	sendMessage(msg.chat.id, message, msg.message_id);
}

function stopCommand(msg) {
	let message;
	logAsApp(`[${msg.from.id}][${msg.from.first_name} ${msg.from.last_name}] is trying to unregister.`);

	if (isRegistered(msg.from.id)) {
		removeUserById(msg.from.id);
		sendMessage(msg.chat.id, 'You have been unregistered.', msg.message_id);
	}
}
//#endregion

//#region BASIC BOT FUNCTIONS
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
	return msg.text.startsWith('/');
}

function isValidCommand(parsedCommand) {
	const result = Object.keys(commands).some((command) => command === parsedCommand);
	return result;
}

// function to parse command
function parseCommand(msg) 
{
	const command = msg.text.split(' ')[0];
	const args = msg.text.split(' ')[1];
	return { command, args };
}

async function sendMessage(chatID, message, replyID) 
{
    // get caller for debug
    const callerName = new Error().stack.split('\n')[2].trim().split(' ')[1];
    // basic conditions
    if (!message || !chatID) { 
        logAsDebug(`[${callerName}] sendMessage: message or chatID is undefined: ${message} ${chatID}`);
        return; 
    }
    // send message to chat
    else if (!replyID) {
        bot.sendMessage(chatID, message, { parse_mode: 'HTML' })
            .then(() => {
                logAsBot(`Sent message to chat -> ${chatID}: ${message}`);
            })
            .catch((error) => {
                logAsBot(`[${callerName}] sendMessage: ${error}`);
            });
    } else if (replyID) {
        bot.sendMessage(chatID, message, { reply_to_message_id: replyID, parse_mode: 'HTML'})
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
	// check if file exists
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	logAsUtility(`${filePath} saved.`);
}
// function to check if file exist by provided path
function pathExist(filePath) { return fs.existsSync(filePath); }

// function to save json object to file by provided path and data
function writeJSON(filePath, data) 
{	
	if (!pathExist(filePath)) 
	{
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} 
	// save data to file
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

	logAsUtility(`${filePath} saved.`);
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

function getUserData(userId) {
	return userDatabase.users.find((user) => user.id === userId);
}

// function to write new user (id) to userDatabase
function writeNewUserToDatabase(userId) 
{
	// add new user to userDatabase.users
	userDatabase.users.push({ "id": userId, "messagesCount": 0, "lastPP": { "id": 0, "time": "" }, "collection": { "pp": { "id": 0, "time": "" }, "pp2": { "id": 0, "time": "" } } });
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
	else { logAsApp('PP or PP.rarity is undefined, or rarityData[PP.rarity] does not exist'); }

    if (!message) message = `Fix me: ${this.name} function.`;

    return message;
}

// expose function to add new pp to pp.json
// params - id, rarity, description
// usage - addNewPP(1,`Rare`, `Description`);
function addNewPP(PP) {
	// check if this id exist in ppList
	if (ppList.find((PP) => PP.id === id)) {
		logAsApp(`Tried to add new PP to pp.json with id ${id}, but it already exist.`);
		return;
	}

	ppList.push({ id, description, rarity });
	fs.writeFileSync(path.join(storageFolderPath, '/pp.json'), JSON.stringify(ppList, null, 2));
}

// if user has PP by id, search in userDatabase, return bool
function userHasPP(userId, PPId) {
	const result = false;
	const user = getUserData(userId);
	if (!user) { return; }

	for (const PP in user.collection) {
		if (PP.id === PPId) {
			result = true;
			break;
		}
	}

	return result;
}

function userLastPPReceived(userId) {
	const user = getUserData(userId);
	if (!user) { return; }
	return user.lastPP;
}

// check how many time unti next possible pp get by user id
function timeUntilNextPossiblePPGet(userId) {
	if (!isRegistered(userId)) { return; }

	const userData = getUserData(userId);
	const lastTimePPReceived = userData.lastPP.time;
	const nextPossibleGetTime = new Date(lastTimePPReceived);
	nextPossibleGetTime.setHours(nextPossibleGetTime.getHours() + timeout_pp);
	const currentTime = new Date();
	const timeLeft = nextPossibleGetTime - currentTime;
	return timeLeft;
}

// count number of PP owners in userDatabase
function countPPOwners(PPId) {
	let count = 0;
	for (const user in userDatabase) {
		if (userDatabase[user][PPId]) {
			count++;
		}
	}
	return count;
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

	// if user has PP - ret
	if (userHasPP(userId, PPId)) {
		logAsApp(`User [${userId}] already has PP [${PPId}].`);
		return;
	}

	// if has user and user has no PP - add PP
	user.collection.push({ "id": PPId, "time": new Date() });
}

function getPPbyID(PPId) 
{
	const PP = ppList.find((PP) => PP.id === PPId);
	if (!PP) { logAsApp(`Tried to get PP by id: ${PPId}, but failed`); }
	return PP;
}

function userPPcount(userID)
{
	const count = 0;
	const users = userDatabase.users;

	if (users) { 
		if (users.collection) count = users.collection.length; 
	}
	
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
    if (!token) {
        logAsApp(`Token not found. Please put it to ${tokenPath} with your token or input now:`);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        token = await new Promise(resolve => {
            rl.question('Please enter your bot token from @botfather: ', (input) => {
                rl.close();
                resolve(input);
            });
        });
		if (token) { writeJSON(tokenPath, { "token": token }); }
    }

    // Create a new instance of the Telegram bot
    bot = new TelegramBot(token, { polling: true });

    // Start web backend
    webBackend = new ExpressBackend();

    bot.on('message', (msg) => {
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

    webBackend.start();
}

// run initial function to create all objects and setup them
startup();

// #endregion