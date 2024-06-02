const admin = require('firebase-admin');
const os = require('os');
let app;

class FirebaseConnector {
  /**
 * Initializes the Firebase Admin SDK and sets up the database connection.
 * 
 * This constructor is responsible for initializing the Firebase Admin SDK and
 * configuring the database connection using the provided app settings. It
 * attempts to initialize the Firebase Admin SDK and database, and logs any
 * errors that occur during the process.
 * 
 * @param {object} _app - The application object containing the necessary
 * settings for initializing the Firebase Admin SDK and database connection.
 */
  constructor(_app) {
    try {
      app = _app;
      admin.initializeApp({
        credential: admin.credential.cert(_app.SETTINGS.db.serviceAccount),
        databaseURL: _app.SETTINGS.db.databaseURL
      });
      this.db = admin.database();
      this.start();
    } catch (error) {
      if (_app && _app.logger) {
        _app.logger.log(error.stack, "error");
      } else {
        console.error(error.stack);
      }
    }
  }

  async time () {
    return admin.database.ServerValue.TIMESTAMP;
  }

  /**
 * Pushes a new record to the user's database path.
 *
 * @param {object} _msg - The message object containing the user's information.
 * @param {string} _path - The path in the database to push the record to.
 * @param {any} _value - The value to push to the database.
 * @returns {Promise<{ success: boolean, key?: string, error?: string }>} - An object indicating the success of the operation and the key of the pushed record, or an error message.
 */
  async db_user_push(_msg, _path, _value) {
    try {
      if (this.exist(app.SETTINGS.path.db.users + _msg.from.id)) {
        const ref = this.db.ref(app.SETTINGS.path.db.users + "/" + _msg.from.id + _path);
        const snapshot = await ref.push(_value);
        app.logger.log(`Record pushed successfully with id: ${snapshot.key}`, "debug");
        return { success: true, key: snapshot.key };
      }
      else {
        app.logger.log("User not found: " + _msg.from.id, "error");
        return { success: false, error: "User not found: " + _msg.from.id };
      }
    }
    catch (error) {
      app.logger.log(error.stack, "error");
      return { success: false, error: error.stack };
    }
  }

  /**
   * Overrides the data in the Firebase database at the specified path.
   *
   * @param {string} _path - The path in the Firebase Realtime Database where the data should be overridden.
   * @param {any} _value - The new value to be set at the specified path.
   * @returns {Promise<{ success: boolean, error?: string }>} - A promise that resolves with an object indicating the success of the operation and an optional error message.
   */
  async db_override(_path, _value) {
    try {
      const ref = this.db.ref(_path);
      await ref.set(_value);
      return { success: true };
    }
    catch (error) {
      app.logger.log(error.stack, "error");
      return { success: false, error: error.stack };
    }
  }


 /**
 * Atomically increments the value stored at the specified Firebase Realtime Database reference path.
 *
 * @param {string} refPath - The path to the Firebase Realtime Database reference to be incremented.
 * @returns {currentValue} return result of increment
 */
  async db_increment(refPath, amount) {
    try {
      const ref = this.db.ref(refPath);
      let currentValue = (await ref.once('value')).val() || 0;
      let newValue = currentValue + (amount || 1);
      await ref.transaction(currentValue => newValue);
      app.logger.log("Value:" + ref + " has been set to:" + newValue, "debug");
      return newValue;
    } catch (error) {
      app.logger.log(error.stack, "error");
    }
  }

 
  /**
 * Writes a new user to the Firebase database.
 *
 * @param {object} msg - The message object containing user information.
 * @returns {Promise<object>} The user object that was written to the database.
 */
  async db_user_new_write(msg) {
    try {
      const user = app.SETTINGS.model.user;
      const stats = app.SETTINGS.model.stats;
      user.id = msg.from.id;
      user.username = msg.from.username || "";
      user.first_name = msg.from.first_name || "";
      user.last_name = msg.from.last_name || "";
      user.stats = stats;
      user.stats.register = {
        chatId: msg.chat.id || msg.from.id,
        time: new Date().toISOString()
      };

      await this.db.ref(app.SETTINGS.path.db.users + "/" + user.id).set(user);

      app.logger.log("User written to database:" + user, "debug");
      return user;
    }
    catch (error) {
      app.logger.log(error.stack, "error");
      return undefined;
    }
  }

  /**
 * Asynchronously removes a user from the database.
 *
 * @param {Object} msg - The message object containing the user's ID.
 * @param {string} msg.from.id - The ID of the user to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the user is successfully removed, or rejects with an error.
 */
  async db_user_erase(msg) {
    try {
      await this.db.ref(app.SETTINGS.path.db.users + "/" + msg.from.id).remove();
      app.logger.log(`${app.SETTINGS.locale.console.db_user_erase_pass} ${msg.from.id}`, "debug");
    } catch (error) {
      app.logger.log(`${app.SETTINGS.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error");
    }
  }

  /**
 * Retrieves the user data from the Firebase Realtime Database.
 *
 * @param {Object} _msg - The message object containing the user ID.
 * @returns {Promise<Object|undefined>} - The user data, or `undefined` if an error occurs.
 */
  async db_user(_msg) {
    try {
      const userRef = this.db.ref(app.SETTINGS.path.db.users + "/" + _msg.from.id);
      const userSnapshot = await userRef.once('value');
      app.logger.log("User found: " + _msg.from.id, "debug");
      return userSnapshot.val();
    }
    catch (error) {
      app.logger.log(error.stack, "error");
      return undefined;
    }
  }

  async exist(_path)
  {
    const ref = this.db.ref(_path);
    const snapshot = await ref.once('value');
    return snapshot.exists();
  }

  /**
 * Asynchronously pushes data to the specified Firebase Realtime Database path.
 *
 * @param {string} _path - The path in the Firebase Realtime Database to push the data to.
 * @param {Object} _data - The data to be pushed to the specified path.
 * @returns {Promise<void>} - A Promise that resolves when the data has been successfully pushed to the database.
 * @throws {Error} - If there is an error pushing the data to the database.
 */
  async db_push(_path, _data) {
    try {
      const res = await this.db.ref(_path).push(_data);
      app.logger.log(app.SETTINGS.locale.console.db_write_pass + _path + "/" + res.key, "debug");
    } catch (error) {
      app.logger.log(error.stack, "error");
    }
  }

  /**
 * Asynchronously sets the data at the specified path in the Realtime Database.
 *
 * @param {string} _path - The path in the Realtime Database where the data should be set.
 * @param {any} _data - The data to be set at the specified path.
 * @returns {Promise<{ success: boolean }>} - A Promise that resolves to an object with a `success` property indicating whether the operation was successful.
 */
  async db_set(_path, _data) {
    try {
      const ref = this.db.ref(_path);
      await ref.set(_data);
      app.logger.log(app.SETTINGS.locale.console.db_write_pass + _path + "/" + ref.key, "debug");
      return { success: true };

    } catch (error) {
      app.logger.log(error.stack, "error");
    }
  }

  /**
 * Asynchronously retrieves data from the Firebase Realtime Database at the specified path.
 *
 * @param {string} _path - The path in the Firebase Realtime Database to retrieve data from.
 * @returns {Promise<any>} - A Promise that resolves to the data retrieved from the specified path.
 */
  async db_get(_path) {
    try {
      const ref = await this.db.ref(_path);
      const userSnapshot = await ref.once('value');
      app.logger.log("Read from db successfully:" + _path, "debug");
      return userSnapshot.val();
    } catch (error) {
      app.logger.log(error.stack, "error");
    }
  }
  
  /**
 * Deletes a database reference at the specified path.
 *
 * @param {string} _path - The path to the database reference to be deleted.
 * @returns {Promise<void>} - A Promise that resolves when the database reference has been deleted.
 * @throws {Error} - If an error occurs while deleting the database reference.
 */
  async db_delete(_path) {
    try {
      await this.db.ref(_path).remove();
      app.logger.log(app.SETTINGS.locale.console.db_delete_pass + _path, "debug");
    } catch (error) {
      app.logger.log(error.stack, "error");
    }
  }

  /**
 * Starts the Firebase initialization process and logs relevant system information to the database.
 *
 * This method is responsible for the following tasks:
 * - Logs a "Firebase initialized" message to the app logger with the "info" level.
 * - Collects various system information, including start time, hostname, platform, release, type, uptime, and version.
 * - Pushes the collected system information to the database at the path specified by `app.SETTINGS.path.db.stats.session`.
 */
  async start() {
    app.logger.log("Firebase initialized", "info");
    const data = {
      start_time: this.time(),
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      uptime: os.uptime(),
      version: os.version()
    };
    await this.db.ref(app.SETTINGS.path.db.stats.session).push(data);
  }
}

module.exports = FirebaseConnector;
