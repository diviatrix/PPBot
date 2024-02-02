// #region IMPORTS
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const timeout_pp = 24; // in hours
const ExpressBackend = require('./ExpressBackend.js');
const { is } = require('bluebird');
const { log } = require('console');
const ms = require('ms');
// #endregion

// #region CONSTANTS
// Specify the storage folder path
const storageFolderPath = '/storage';
const publicFolderPath = '/public';

// JSONs and paths
const userDatabasePath = path.join(storageFolderPath, 'userDatabase.json');
const userDatabase = openOrCreateJSON(userDatabasePath);

const tokenPath = path.join(storageFolderPath, 'token.json');
const token = openOrCreateJSON(tokenPath).token;

const rarityPath = path.join(storageFolderPath, '/arity.json');
const rarityData = openOrCreateJSON(rarityPath);

const messageStringsPath = path.join(storageFolderPath, 'messageStrings.json');
const messageStrings = openOrCreateJSON(messageStringsPath);

const ppPath = path.join(storageFolderPath, 'pp.json');
const ppList = openOrCreateJSON(ppPath);

const defaultUserPath = path.join(storageFolderPath, 'defaultUser.json');
const defaultUser = openOrCreateJSON(defaultUserPath);
// #endregion

//#region COMMANDS OBJECT
const commands = {
	'/info': (msg) => {
		logAsBot(`[${msg.from.name}][${msg.from.id}] is trying to get info.`);		
		infoCommand(msg);
		
	},
	'/pp': (msg) => {
		logAsBot(`${msg.from.name}][${msg.from.id}] is trying to get PP.`);
		ppCommand(msg);		
	},
	'/stop': (msg) => {
		logAsBot(`${msg.from.name}][${msg.from.id}] is trying to unregister.`);
		stopCommand(msg);
	},
	'/go': (msg) => {
		logAsBot(`${msg.from.name}][${msg.from.id}] is trying to register.`);
		goCommand(msg);
	}
};
//#endregion

// Create a new instance of the Telegram bot
const bot = new TelegramBot(token, { polling: true });

// Start web backend
const webBackend = new ExpressBackend();

// run initial function to create all objects and setup them
startup();

//#region BOT COMMANDS
// parse command to command, args
function parseCommand(msg) {
	const command = msg.text.split(' ')[0];
	const args = msg.text.split(' ').slice(1);

	return { command, args };
}


// /info command
// shows user info
// usage - /info for self info
// usage - /info number for get count how many users have this PP
function infoCommand(msg) {
	let message;

	if (args.length === 1) {
		message = `${msg.from.name} stats:\n - Message counter: ${getUserDataFromDatabase(msg.from.id).messagesCount}\n -PP count: ${Object.keys(userDatabase[msg.from.id]).length}`;
	}
	else if (parseInt(args[1])) {
		const PPId = parseInt(args[1]);
		const count = countPPOwners(PPId);
		message =  `There are ${count} Dudes who have ${PPId}.`;
	}
	else {
		message = 'Incorrect usage. Use /info for self info, /info @username for user info or /info number for get count how many users have this PP.';
	}
	logAsBot(`Sent message to chat -> ${chatId}: ${message}`);
	sendMessage(chatId, message);
}

// /pp command
// shows user PP
// usage - /pp for random PP of the day
// usage - /pp number to get info about this PP
function ppCommand(userId, args) {
	let message;
	
	if (args.length === 0) {
		const PP = getRandomPP(userId);
		addPPToUserInDatabase(userId, PP.id);
		message = 'Your PP size of the day is: ' + preparePPMessageById(PP.id);
	}
	else if (args.length === 1) {
		const PPId = parseInt(args[0]);
		if (userHasPPInDatabase(userId, PPId)) {
			message = `You already have ${PPId}.`;
		}
		else {
			addPPToUserInDatabase(userId, PPId);
			message = 'You got ' + preparePPMessageById(PPId);
		}
	}

	bot.sendMessage(chatId, message);
}

function goCommand(userId, args) {
	let message;
	
	console.log(`${userId} is trying to register.`);	

	// check if registerd already
	if (isRegistered(userId)) {
		message = 'You are already registered.';
	}
	// register if not
	else {
		writeNewUserToDatabase(userId);
		message = 'You have been registered as THE DUDE.';
	}

	bot.sendMessage(chatId, message);
}

function stopCommand(msg) {
	let message;
	console.log(`${msg.from.id} is trying to unregister.`);

	if (isRegistered(userId)) {
		// TODO: delete user from userDatabase
		message = 'You have been unregistered.';
		sendMessage(chatId, message);
	}
}
//#endregion

//#region UTILITY FUNCTIONS ----
function logAsBot(message) { console.log(`[Bot]: ${message}`); }
function logAsUser(msg) { console.log(`[${msg.from.name}]: ${message}`); }
function logAsApp(message) { console.log(`[App]: ${message}`); }
function logAsUtility(message) { console.log(`[Utility]: ${message}`); }
//#endregion

//#region BASIC BOT FUNCTIONS
// function to recieve command from user and trigger action
function recieveCommand(msg) {
	const recievedCommand = parseCommand(msg);
	if (isValidCommand(parseCommand(msg))) {
		commands[command](msg);
	}
}

// function to check if message is command
function isCommand(messageText) {
	return messageText.startsWith('/');
}

function isValidCommand(recieveCommand) {
	return commands[recieveCommand.command] !== undefined;
}

// function to parse command
function parseCommand(msg) {
	const command = msg.text.split(' ')[0];
	const args = msg.text.split(' ').slice(1);

	return { command, args };
}

function sendMessage(chatId, message) {
	bot.sendMessage(chatId, message);
	logAsBot(`Sent message to chat -> ${chatId}: ${message}`);
}
//#endregion

//#region LOAD SAVE JSON FUNCTIONS

// function to open or create json file by provided path and data
function openOrCreateJSON(filePath, data) {
	if (data === undefined) { data = {}; }
	if (!pathExist(filePath)) { createJSON(filePath, data); logAsUtility(`Can't find ${filePath} -> created empty.`);}
}

// function to create empty json file by provided path and data
function createJSON(filePath, data) 
{
	if (!pathExist(filePath)) { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); }
}

// function to check if file exist by provided path
function pathExist(filePath) { return fs.existsSync(filePath); }

// function to save json object to file by provided path and data
function writeJSON(filePath, data) 
{
	// save data to file
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	logAsUtility(`${filePath} saved.`);
}
//#endregion

//#region USER DATABSE FUNCTIONS
// Load userDatabase from default path
function loadUserDatabase() 
{
	userDatabase = openOrCreateJSON(userDatabasePath);
}

// Load or create userDatabase with default path
// database has to have first user with id 0 to work properly
function loadOrCreateUserDatabase() 
{
	if (loadUserDatabase()) {
		return loadUserDatabase();
	}
	else {
		const userDatabase = { 0: { messagesCount: 0, lastPPReceived: null } };
		writeJSON(userDatabasePath, userDatabase);
		return userDatabase;
	}
}
// #endregion

//#region ACCOUNT FUNCTIONS
function isRegistered(userId) {
	if (!userDatabase) { return false; }
	else { userDatabase[userId] !== undefined; }
}

// function to add message counter ++ by user id
function addMessageCountByUserId(userId) {
	if (!userDatabase) { return;}

	if (isRegistered(userId)) {
		userDatabase[userId].messagesCount++;
		writeJSON(storageFolderPath, userDatabasePath, userDatabase); 
	}
}

// function to write new user (id) to userDatabase
function writeNewUserToDatabase(userId) {
	if (!isRegistered(userId)) {
		userDatabase[userId] = {
			messagesCount: 0,
			lastPPReceived: null
		};

		console.log(`New user [${userId}] added to userDatabase.`);
		writeJSON(storageFolderPath, userDatabasePath, userDatabase);
	}
}

// function to get user data from database by user id
function getUserDataFromDatabase(userId) {
	return userDatabase[userId];
}
// #endregion

// #region PP FUNCTIONS

// check if provided time + timeout is less than current time
function isPPTimePassed(time) {
	const currentTime = new Date();
	const timeToCheck = new Date(time);
	timeToCheck.setHours(timeToCheck.getHours() + timeout_pp);
	return currentTime > timeToCheck;
} 

// prepare string to message about pp by id
// [Rarity][Number] Description
function preparePPMessageById(PPId) {
	const PP = ppList.find((PP) => PP.id === PPId);
	mesStr = messageStrings[rarityData[PP.rarity]];
	message = `${mesStr.open}`[`${PP.rarity} `]` ${PP.number}] ${PP.description}${mesStr.close}`;
	return message;
}

// expose function to add new pp to pp.json
// params - id, rarity, description
// usage - addNewPP(1,`Rare`, `Description`);
function addNewPP(id, rarity, description) {
	// check if this id exist in ppList
	if (ppList.find((PP) => PP.id === id)) {
		console.log(`Tried to add new PP to pp.json with id ${id}, but it already exist.`);
		return;
	}

	ppList.push({ id, rarity, description });
	fs.writeFileSync(path.join(storageFolderPath, '/pp.json'), JSON.stringify(ppList, null, 2));
}

// check how many time unti next possible pp get by user id
function timeUntilNextPossiblePPGet(userId) {
	if (!isRegistered(userId)) { return; }

	const userData = getUserDataFromDatabase(userId);
	const lastTimePPReceived = userData.lastPPReceived.time;
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

// function to add PP to user (id) in userDatabase
function addPPToUserInDatabase(userId, PPId) {
	// add PP to user in userDatabase
	userDatabase[userId][PPId].time = new Date();
	// set last PP received by user
	userDatabase[userId].lastPPReceived = PPId;
	userDatabase[userId].lastPPReceived.time = new Date();

	// save userDatabase to file		
	writeJSON(storageFolderPath, userDatabasePath, userDatabase);
}

// function to check if user (id) has PP in userDatabase
function userHasPPInDatabase(userId, PPId) {
	return userDatabase[userId]?.[PPId] !== undefined;
}

function getRandomPP(userId) {
	let randomPP;
	let userHasPP = true;

	while (userHasPP) {
		randomPP = data.PP[Math.floor(Math.random() * data.PP.length)];
		if (!userDatabase[userId]?.includes(randomPP.id)) {
			userHasPP = false;
			userDatabase[userId] ??= [];
			userDatabase[userId].push(randomPP.id);
		}
	}

	return randomPP;
}
// #endregion

// #region BOT HANDLERS
// INITIAL MESSAGE RECIEVE
// on any text message show it in console with user id [] and username
bot.on('message', (msg) => {
	// check if message is command "/"
	if (isCommand(msg.text)) {
		recieveCommand(msg.from.id, msg.text);
	}
	// or check if user registered and add to variables 
	else if (isRegistered(msg.from.id)) {
		// add +1 to user message counter
		addMessageCountByUserId(msg.from.id);
	}

	console.log(`[${msg.from.id}] ${msg.from.username}: ${msg.text}`);
	return;
});
// #endregion

// #region STARTUP
// startup function to create all objects and setup them
function startup()
{
	preCheck();
	webBackend.start();
}

// function to check if all files exist and create them if not
function preCheck() 
{
	// telegram bot values
	token = openOrCreateJSON(tokenPath, { token: 'YOUR TOKEN HERE' }) === undefined;

	// userDatabase values
	userDatabase = openOrCreateJSON(userDatabasePath, { "users": {0: defaultUser[0]} });


	// other jsons
	if (openOrCreateJSON(rarityPath) === undefined) {
		writeJSON(storageFolderPath, rarityPath, 
			{
				"normal": {
					"color": "#808080",
					"text": "Normal",
					"dropRate": 0.5
				}
			});
	}
}
// #endregion