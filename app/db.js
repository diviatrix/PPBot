const Logger = require('./logger.js');
const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");

let logger = new Logger();

class DB {
  constructor(_settings) {
    try {
      this.app = initializeApp(_settings.firebaseConfig);
      if (getAnalytics.isSupported) {
        this.analytics = getAnalytics(this.app);
      }
      this.saveRunData();
      logger.log("Firebase initialized", "info");
    } catch (error) {
      logger.log(error, "error");
    }
  }

  async ConnectFirebaseDB(id)
  {
    try {
      const db = this.app.getDatabase(id);
      return db;
    } catch (error) {
      console.error(error);
    }
    

  }

  async saveRunData() {
    // check if table "statistics" exists
    // if not create it
    // update fields:
    // - run: increment by 1
    // - lastRun: current date and time
    // - settings: json to string
    let db = this;
    return new Promise((resolve, reject) => {
      try {
        const runData = {
          run: 1,
          lastRun: new Date().toISOString(),
          settings: JSON.stringify(db.settings),
        };
        resolve(runData);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = DB;