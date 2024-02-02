const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
// Load your Telegram bot token
const token = '314547287:AAHXHfDhzj02Z8r6nog_UZwIotsSYJ5eH9Y';
const timeout_pp = 24; // in hours
const ExpressBackend = require('./ExpressBackend.js');
const { is } = require('bluebird');

// Specify the storage folder path
const storageFolderPath = 'storage';

// Create a new instance of the Telegram bot
const bot = new TelegramBot(token, { polling: true });

// JSONs and paths
const userDatabasePath = '/userDatabase.json';
const userDatabase = loadJSON(path.join(storageFolderPath, userDatabasePath));
const rarityPath = '/rarity.json';
const rarityData = loadJSON(path.join(storageFolderPath, rarityPath));
const messageStringsPath = '/messageStrings.json';
const messageStrings = loadJSON(path.join(storageFolderPath, messageStringsPath));
const ppPath = '/pp.json';
const ppList = loadJSON(path.join(storageFolderPath, ppPath));

const webBackend = new ExpressBackend();

startup();

// startup function to create all objects and setup them
function startup()
{
	webBackend.start();
}



// COMMANDS BLOCK

// /info command
// shows user info
// usage - /info for self info
// usage - /info number for get count how many users have this PP
bot.onText(/\/info(@\w+)?/, (msg, match) => {
	// get chat id
	const chatId = msg.chat.id;
	// get user id
	const userId = msg.from.id;
	// if no username provided, show self info
	if (msg.text === '/info') {
		// show user info
		// user id, message counter, count of PP
		message = `User id is: ${userId}\nMessage counter: ${getUserDataFromDatabase(userId).messagesCount}\nPP count: ${Object.keys(userDatabase[userId]).length}`;
		bot.sendMessage(chatId, message);
	}
	// try to parse int after /info %someInteger%
	else if (parseInt(msg.text.split(' ')[1])) {
		// show how many users have this PP
		const PPId = parseInt(msg.text.split(' ')[1]);
		const count = countPPOwners(PPId);
		bot.sendMessage(chatId,  `$}There are ${count} Dudes who have ${PPId}.`);
	}
	else {
		// incorrent usage
		bot.sendMessage(chatId, 'Incorrect usage. Use /info for self info, /info @username for user info or /info number for get count how many users have this PP.');
	}
});

// Handle the "/pp" command
bot.onText(/\/pp(@\w+)?/, (msg) => {
	if (!isRegistered(msg.from.id)) { return; }

	const userData = getUserDataFromDatabase(userId);
	
	// if user is registered and has recieved PP today, send new PP
	// send message with time of next possible get
	if (userData && userData.lastPPReceived && !isTimePassed(userData.lastPPReceived.time)) {		
		// send message to user with last received PP and time of next possible get		
		bot.sendMessage(msg.chat.id, `${msg.from.username} already got PP of the day: ${preparePPMessageById(userData.lastPPReceived.id)} You can get a new one after ${(timeUntilNextPossiblePPGet(msg.from.id) / 1000 / 60 / 60).toFixed(1)} hours.`);
		return;
	}
	else if (userData) {
		// send new PP to user
		const PP = getRandomPP();
		addPPToUserInDatabase(userId, PP.id);
		const message = 'Your PP size of the day is: ' + preparePPMessageById(PP.id);

		bot.sendMessage(chatId, message);
	}
	else {
		// send message to user to register
		bot.sendMessage(chatId, `${msg.from.username}}You need to register first. Use /go command to register.`);
	}
});

// /stop command, find user in db and remove
bot.onText(/\/stop(@\w+)?/, (msg) => {
	if (!isRegistered(msg.from.id)) { return; }

	// check if user already registered
	if (isRegistered(msg.from.id)) {
		delete userDatabase[userId];
		saveJSON(storageFolderPath, userDatabasePath, userDatabase);
		console.log(`[${msg.from.id}] ${msg.from.username} has been removed from database.`);
		bot.sendMessage(msg.chat.id, `<b>${msg.from.username} has been removed from database.</b>`, { parse_mode: 'HTML' });
	}
	else
	{
		console.log(`[${userId}] ${msg.from.username} is not registered.`);
		bot.sendMessage(msg.chat.id, `<b>${msg.from.username} is not registered.</b>`, { parse_mode: 'HTML' });
	}
});

// command to register player in bot database
// /go
bot.onText(/\/go(@\w+)?/, (msg) => {
	if (!isRegistered(msg.from.id)) 
	{
		writeNewUserToDatabase(msg.from.id);
	}

	try {
		// check if user already registered
		if (isRegistered(userId)) {
			console.log(`[${msg.from.id}] ${msg.from.username} is already registered.`);
			return;
		} else {
			writeNewUserToDatabase(userId);
			console.log(`[${userId}] ${msg.from.username} has been registered.`);
			bot.sendMessage(msg.chat.id, `<b>${msg.from.username} have been registered as THE DUDE.</b>`, { parse_mode: 'HTML' });
		}
	} catch (error) {
		console.error(`Error occurred while registering user: ${error}`);
		bot.sendMessage(msg.chat.id, `An error occurred while registering. Please try again later.`);
	}
});

// INITIAL MESSAGE RECIEVE
// on any text message show it in console with user id [] and username
bot.on('message', (msg) => {
	// check if message is command "/"
	if (msg.text.startsWith('/')) {
		recieveCommand(msg.text);
		return;
	}
	// or check if user registered and add to 
	// or send to console.log and ignore
	else {
		// show message in console
		console.log(`[${msg.from.id}] ${msg.from.username}: ${msg.text}`);
		return;
	}



	// show message in console
	console.log(`[${msg.from.id}] ${msg.from.username}: ${msg.text}`);

	// leave if no userDatabase
	if (!userDatabase) 
	{
		console.log('userDatabase is not defined or empty. Do nothin.');	
		return;
	}

	// leave if not registered
	if (getUserDataFromDatabase(msg.from.id) === undefined) { return; }

	// add +1 to user message counter
	addMessageCountByUserId(msg.from.id);
	
	// log counter value to console
	
	console.log(`[${msg.from.id}] message counter: ${getUserDataFromDatabase(msg.from.id).messagesCount}`);
});

// function to recieve command from user and trigger action
function recieveCommand(command) {

	switch (command) {
		case '/go':
			// register user
			break;
		case '/stop':
			// remove user
			break;
		case '/info':
			// show user info
			break;
		case '/pp':
			// get PP
			break;
		default:
			// unknown command
			break;
	}
}

// FUNCTIONS BLOCK

// function to load json as object by provided path
// checks if file exist, if not creates new one and alerts about it
function loadJSON(filePath) {
	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
		console.log(`${filePath} created.`);
	}
	try {
		return JSON.parse(fs.readFileSync(filePath));
	}
	catch (err) {
		console.error(`Could not read ${filePath} file.`);
	}
}

// function to save json object to file by provided path and data
function saveJSON(folderPath, filePath, data) 
{
	// if path not exist create 
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
		console.log(`${folderPath} created.`);
	}
	
	// save data to file
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	console.log(`${filePath} saved.`);
}

function isRegistered(userId) {
	if (!userDatabase) { return false; }
	else { userDatabase[userId] !== undefined; }
}

// function to add message counter ++ by user id
function addMessageCountByUserId(userId) {
	if (!userDatabase) { return;}

	if (isRegistered(userId)) {
		userDatabase[userId].messagesCount++;
		saveJSON(storageFolderPath, userDatabasePath, userDatabase); 
	}
}

// check if provided time + timeout is less than current time
function isTimePassed(time) {
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

// function to write new user (id) to userDatabase
function writeNewUserToDatabase(userId) {
	if (!isRegistered(userId)) {
		userDatabase[userId] = {
			messagesCount: 0,
			lastPPReceived: null
		};

		console.log(`New user [${userId}] added to userDatabase.`);
		saveJSON(storageFolderPath, userDatabasePath, userDatabase);
	}
}

// function to add PP to user (id) in userDatabase
function addPPToUserInDatabase(userId, PPId) {
	// add PP to user in userDatabase
	userDatabase[userId][PPId].time = new Date();
	// set last PP received by user
	userDatabase[userId].lastPPReceived = PPId;
	userDatabase[userId].lastPPReceived.time = new Date();

	// save userDatabase to file		
	saveJSON(storageFolderPath, userDatabasePath, userDatabase);
}

// function to get user data from database by user id
function getUserDataFromDatabase(userId) {
	return userDatabase[userId];
}

// function to check if user (id) has PP in userDatabase
function userHasPPInDatabase(userId, PPId) {
	return userDatabase[userId]?.[PPId] !== undefined;
}

// method to find random PP in data
// db example
//const userDatabase = {
	//	"123456789": {
	//		"pp1": true,
	//		"pp3": true
	//	},
	//	"987654321": {
	//		"pp2": true,
	//		"pp4": true
	//	}
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
};