const WebBackend = require('./app/webBackend.js');
const Logger = require('./app/logger.js');
const TGBot = require('./app/bot.js');
const FirebaseConnector = require('./app/firebase.js');
const SETTINGS = require('./app/storage/settings.json');
const Reward = require('./app/reward.js');
const Achievement = require('./app/achievement.js');
const achievements = require('./app/storage/achievements.json');
const HELPER = require('./app/helper.js');
const COLLECTIBLES = require('./app/storage/collectible.json');
const COMMANDS = require('./app/commands.js');
const CONSOLE = require('./app/console.js');

/* eslint-env node */
process.noDeprecation = true;

// #region IMPORTS
// #endregion

// #region VARS
this.logger = new Logger(SETTINGS.loggerLevel); // can be initialized without any requirements
this.webBackend; // will be created later
this.tgBot; // will be created later after token check
this.run = false; // used for checking if the app is running or not (used in stop function)
this.db;
this.reward;
this.CONSOLE;
this.HELPER = new HELPER(this.logger);

// Add SETTINGS to the context
this.SETTINGS = SETTINGS;
this.achievements = achievements;
this.COLLECTIBLES = COLLECTIBLES;

const initialize = async () => {
	await start();
}

const start = async () => {
	if (this.run) { this.logger.log("Application is already running", "info"); return; }
	try {
		if (!this.CONSOLE) this.CONSOLE = new CONSOLE(this);
		this.db = new FirebaseConnector(this);
		this.commands = new COMMANDS(this, this.logger);
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
}

function stop() {
	if (!this.run) { return; }
	this.run = false;
	cleanUp();
}



async function cleanUp() {
	// stop and cleanup tgbot
	await this.tgBot.stop();
	// stop and cleanup webbackend
	await this.webBackend.stop();
	return;
}

initialize();

