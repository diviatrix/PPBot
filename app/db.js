const sqlite3 = require('sqlite3').verbose();
const Logger = require('./logger.js');
const path = require('path');

let logger = new Logger();


class DB {
  constructor(_path) {
    logger.log(path.resolve(_path), "debug");
    try {      
      this.db = new sqlite3.Database(`${_path}`, (err) => {
        if (err) {
          throw err;
        }
        console.log('Connected to the database.');
      });

      this.run();
    } catch (err) {
      console.error(err);
    }
    return this;
  }

  run() {
    this.db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE
    )
  `, (err) => {
      if (err) {
        console.error(err.message);
      }
    });
  }
}

module.exports = DB;