const WebBackend = require('./app/webBackend.js');
const Logger = require('./app/logger.js');
const TGBot = require('./app/bot.js');
const FirebaseConnector = require('./app/firebase.js');
const readline = require('readline');
const settings = require('./app/storage/settings.json');
const Reward = require('./app/reward.js');
const Achievement = require('./app/achievement.js');
const achievements = require('./app/storage/achievements.json');
const Helper = require('./app/helper.js');
const collectibles = require('./app/storage/collectible.json');
const Commands = require('./app/commands.js');

/* eslint-env node */
process.noDeprecation = true;

// #region IMPORTS
// #endregion

// #region VARS
this.logger = new Logger(settings.loggerLevel); // can be initialized without any requirements
this.webBackend; // will be created later
this.tgBot; // will be created later after token check
this.run = false; // used for checking if the app is running or not (used in stop function)
this.rl = null;
this.db;
this.reward;
this.helper = new Helper(this.logger);

// Add settings to the context
this.settings = settings;
this.achievements = achievements;
this.collectibles = collectibles;

const initialize = async () => {
	await start();
	this.rl = readline.createInterface({ input: process.stdin, output: process.stdout});    
}

const start = async () => {
	if (this.run) {this.logger.log("Application is already running", "info"); return; }
	try {			
			this.db = new FirebaseConnector(this);
			this.commands = new Commands(this, this.logger); 
			this.tgBot = new TGBot(this);
			this.webBackend = new WebBackend(this);
			this.reward = new Reward(this);
			this.achievement = new Achievement(this);			

			this.run = true;
			this.logger.log('Application: Initialization completed', "info");
	}        
	catch (error) {
		if (error.name === 'DeprecationWarning' && error.message.includes('punycode')) {
			this.logger.log("Fix is waiting for telegram-node-bot and eslint remove punycode dependency", "warning");
		} else {
		const errorMessage = `Application: Error initializing at ${error.stack}`;
		this.logger.log(errorMessage, "error");
		}
	}

	await readInput();
}

async function stop() {
	if (!this.run) {	return;	}
	this.run = false;
	cleanUp();
}

async function readInput()
{	
	if (this.rl) {
		this.rl.question("> ", async (answer) => {
			await parseCommand(answer);
			readInput();
		});
	}
}

// parse command from user answer
async function parseCommand(userAnswer){
	// exit command
	if(userAnswer == 'exit'){ process.exit(0); }
	else if(userAnswer == 'start'){ await start(); this.logger.log("Application started", "info");}
	else if(userAnswer == 'stop'){ await stop(); this.logger.log("Application stopped", "info");}
	else if(userAnswer == 'help'){ this.logger.log("Available commands: exit, help, reload, status, start, stop", "info"); }
	else if(userAnswer.startsWith('reload')){ await reload(); } 
	else if (userAnswer.startsWith('status')) { this.logger.log("Status: " + (this.run ? "running" : "stopped"), "info");	}
	else this.logger.log("Unknown command, type 'help' for available commands", "warning");
}

async function reload(){
	await cleanUp().then(async ()=>{
		// reinitialize
		await initialize();
		this.logger.log("Reload completed", "info");
	} );
}

async function cleanUp(){
	// stop and cleanup tgbot
	await this.tgBot.stop();
	// stop and cleanup webbackend
	await this.webBackend.stop();
	return;
}

initialize();

