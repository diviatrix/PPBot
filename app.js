/* eslint-env node */
process.noDeprecation = true;
const WebBackend = require('./app/webBackend.js');
const Logger = require('./app/logger.js');
const TGBot = require('./app/bot.js');
const DB = require('./app/firebase.js');
const Achievement = require('./app/achievement.js');
const readline = require('readline');
const settings = require('./app/storage/settings.json');
const eventBus = require('./app/eventBus.js');

// #region IMPORTS
// #endregion

// #region VARS
let logger = new Logger(); // can be initialized without any requirements
let achievementHandler;
let webBackend; // will be created later
let tgBot; // will be created later after token check
let run = false; // used for checking if the app is running or not (used in stop function)
let rl = null;
let db;
// #endregion


async function initialize() {
	await start();
	rl = readline.createInterface({ input: process.stdin, output: process.stdout});	
}

async function start() {
	if (run) {	logger.log("Application is already running", "info"); return; }
	try {
			db = new DB(settings, logger);
			achievementHandler = new Achievement(settings, db, logger);
			tgBot = new TGBot(settings, db, logger);
			webBackend = new WebBackend(settings, logger);
			run = true;
			logger.log('Application: Initialization completed', "info");
	}		
	catch (error) {
		if (error.name === 'DeprecationWarning' && error.message.includes('punycode')) {
			logger.log("Fix is waiting for telegram-node-bot and eslint remove punycode dependency", "warning");
		} else {
		const errorMessage = `Application: Error initializing at ${error.stack}`;
		logger.log(errorMessage, "error");
		}
	}

	await readInput();
}

async function stop() {
	if (!run) {	return;	}
	run = false;
	cleanUp();
}

async function readInput()
{	
	if (rl) {
		rl.question("> ", async (answer) => {
			await parseCommand(answer);
			readInput();
		});
	}
}

// parse command from user answer
async function parseCommand(userAnswer){
	// exit command
	if(userAnswer == 'exit'){ process.exit(0); }
	else if(userAnswer == 'start'){ await start(); logger.log("Application started", "info");}
	else if(userAnswer == 'stop'){ await stop(); logger.log("Application stopped", "info");}
	else if(userAnswer == 'help'){ logger.log("Available commands: exit, help, reload, status, start, stop", "info"); }
	else if(userAnswer.startsWith('reload')){ await reload(); } 
	else if (userAnswer.startsWith('status')) { logger.log("Status: " + (run ? "running" : "stopped"), "info");	}
	else logger.log("Unknown command, type 'help' for available commands", "warning");
}

async function reload(){
	await cleanUp().then(async ()=>{
		// reinitialize
		await initialize();
		logger.log("Reload completed", "info");
	} );
}

async function cleanUp(){
	// stop and cleanup tgbot
	await tgBot.stop();
	// stop and cleanup webbackend
	await webBackend.stop();
	return;
}

initialize();
