// #region IMPORTS
import WebBackend from './app/webBackend.js';
import Loader from './loader.js';
import Logger from './app/logger.js';
import TGBot from './app/bot.js';
import DB from './app/db.js';
import { createInterface } from 'readline';
// #endregion

// #region VARS
let loader; // needs to be created first and async
let logger = new Logger(); // can be initialized without any requirements
let webBackend; // will be created later
let tgBot; // will be created later after token check
let run = false; // used for checking if the app is running or not (used in stop function)
let rl = null;
let db;
// #endregion

function createLoader() {
    return new Promise((resolve, reject) => {
        const loader = new Loader((err) => {
            if (err) {
                reject(err);
            } else {
                logger.log('Loader ready', "app");
                resolve(loader);
            }
        });
    });
} 

async function createDBConnector() {
	if (!loader.settings.defaultLowDBStructure) {
	  throw new Error('Default LowDB structure is missing in settings');
	}
	const db = new DB(loader.settings);
	await db.connect();
	logger.log("Database connected", 'db');
	return db;
  }

async function initialize() {
	await start();
	rl = createInterface({ input: process.stdin, output: process.stdout	});	
}

async function start() {
	try {
		loader = await createLoader();
		db = await createDBConnector();
		tgBot = new TGBot(loader.settings);
		webBackend = new WebBackend(loader.settings);
		run = true;
		logger.log('Application: Initialization completed successfully', "info");
		} catch (error) {
			const errorMessage = `Application: Error initializing at ${error.stack}`;
			logger.log(errorMessage, "error");
		}
}

async function stop() {
	if (!run) {	return;	}
	run = false;
	cleanUp();
}

async function readInput()
{	
	rl?.question("> ", async (answer) => {
		await parseCommand(answer);
		readInput();
	});
}

// parse command from user answer
async function parseCommand(userAnswer){
	// exit command
	if(userAnswer == 'exit'){
		process.exit(0);
	}
	// help command
	else if(userAnswer == 'help'){
		logger.log("Available commands: exit, help, reload, status, start, stop", "info");
	}
	// reload command, cleanup and reinitialize
	else if(userAnswer.startsWith('reload')){
		await reload();
	} 
	else if (userAnswer.startsWith('status')) {
		logger.log("Status: " + (run ? "running" : "stopped"), "info");
	}
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
	await tgBot?.stop();
	tgBot = null;
	// stop and cleanup webbackend
	await webBackend?.stop();
	webBackend = null;
	// remove loader
	loader = null;
	return;
}

initialize();