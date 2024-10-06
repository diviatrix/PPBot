const WEBBACKEND = require('./app/webBackend.js');
const LOGGER = require('./app/logger.js');
const BOT = require('./app/bot.js');
const FIREBASECONNECTOR = require('./app/firebase.js');
const SETTINGS = require('./app/storage/settings.json');
const REWARD = require('./app/reward.js');
const ACHIEVEMENT = require('./app/achievement.js');
const ACHIEVEMENTS = require('./app/storage/achievements.json');
const HELPER = require('./app/helper.js');
const COLLECTIBLES = require('./app/storage/collectible.json');
const COMMANDS = require('./app/commands.js');
const CONSOLE = require('./app/console.js');
const FUNCTIONS = require('./app/functions.js');
const CACHE = require('./app/cache.js');
const GEMINI = require('./app/gemini.js');
const AUTOLOGGER = require('./app/autologger.js');

/* eslint-env node */
process.noDeprecation = true;

// #region VARS
this.WEBBACKEND; // will be created later
this.BOT; // will be created later after token check
this.run = false; // used for checking if the app is running or not (used in stop function)
this.DB;
this.REWARD;
this.CONSOLE;
this.AUTOLOGGER = new AUTOLOGGER();

// Add SETTINGS to the context
this.SETTINGS = SETTINGS;
this.ACHIEVEMENTS = ACHIEVEMENTS;
this.COLLECTIBLES = COLLECTIBLES;


const initialize = async () => {
    this.LOGGER = new LOGGER(SETTINGS.loggerLevel); // can be initialized without any requirements
    start();
};

const start = async () => {
    if (this.run) {
        this.LOGGER.log("Application is already running", "info");
        return;
    }
    try {
        if (!this.CONSOLE) this.CONSOLE = new CONSOLE(this);
        this.FUNCTIONS = new FUNCTIONS(this);
        this.HELPER = new HELPER(this);
        this.DB = new FIREBASECONNECTOR(this);
        this.COMMANDS = new COMMANDS(this);
        this.BOT = new BOT(this);
        this.WEBBACKEND = new WEBBACKEND(this);
        this.REWARD = new REWARD(this);
        this.ACHIEVEMENT = new ACHIEVEMENT(this);
        this.CACHE = new CACHE(this);
        this.GEMINI = new GEMINI(this);
        this.run = true;
        this.LOGGER.log('Application: Initialization completed', "info");
    } catch (error) {
        if (error.name === 'DeprecationWarning' && error.message.includes('punycode')) {
            this.LOGGER.log("Fix is waiting for telegram-node-bot and eslint remove punycode dependency", "warning");
        } else {
            const errorMessage = `Application: Error initializing at ${error.stack}`;
            this.LOGGER.log(errorMessage, "error");
        }
    }
};



// Initialize the logger and wait for the callback
initialize().catch((error) => {
    console.error('Error during logger initialization:', error);
});

