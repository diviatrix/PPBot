const admin = require('firebase-admin');
const os = require('os');

class DB {
  constructor(_settings, _logger) {
    try {
      this.settings = _settings;
      this.logger = _logger;
      admin.initializeApp({
        credential: admin.credential.cert(this.settings.db.serviceAccount)
      });
      this.db = admin.firestore();
      this.start();
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }

  async db_userPush(_msg, _path, _value) {
    try {
      if (await this.db_user_isRegistered(_msg)) {
        await this.db_push(this.settings.path.db.users + "/" + _msg.from.id + _path, _value);
        this.logger.log(this.settings.locale.console.db_user_push_record + _msg.from.id, "debug");
        return true;
      }
      else { this.logger.log("User not found: " + _msg.from.id, "error"); }
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
    }
  }

  async db_user_new_write(msg)
  {
    try {
      const user = this.settings.model.user;
      user.id = msg.from.id;
      user.username = msg.from.username;
      user.first_name = msg.from.first_name || "";
      user.last_name = msg.from.last_name || "";
      user[this.settings.path.db.user.register] = { chatId: msg.chat.id || msg.from.id, time : admin.firestore.Timestamp.fromDate(new Date()) };
      await this.db_push(this.settings.path.db.users, user, user.id.toString());
      return user;
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
      return undefined;
    }
  }
  async db_get_messages(_msg) {
    try {
      let messages = 0;
      const user = await this.db_user_read(_msg);
      if (user.messages) { messages = user.messages; }
      return messages;
    } catch (e) {
      throw new Error("[DB] Can't get messages from user: " + e.stack);
      }
    }

  async db_user_erase(msg) {
    try {
      await this.db_delete(this.settings.path.db.users, msg.from.id.toString());
      this.logger.log(`${this.settings.locale.console.db_user_erase_pass} ${msg.from.id}`, "debug");
    } catch (error) {
      this.logger.log(`${this.settings.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error");
    }
  }

  async db_user(_msg)
  {
    try {
      const userRef = this.db.collection(this.settings.path.db.users).doc(_msg.from.id.toString());
      const userSnapshot = await userRef.get();
      this.logger.log(JSON.stringify(userSnapshot.data(), null, 2), "debug");
      return userSnapshot.data();       
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
      return false;
    }
  }

  async db_user_isRegistered(msg){
    try {
      const userRef = this.db.collection(this.settings.path.db.users).doc(msg.from.id.toString());
      const userSnapshot = await userRef.get();
      const userExists = userSnapshot.exists;
      const logMessage = userExists ? this.settings.locale.console.db_user_exists : this.settings.locale.console.db_user_not_exists;
      this.logger.log(logMessage + msg.from.id, "debug");
      return userExists;
    } catch (error) {
      this.logger.log(error.stack, "error");
      return false;
    }
  }

  async db_push(_path, _data, _id){
    try {
      if (_id) {
        await this.db.collection(_path).doc(_id).set(_data);
        this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + _id, "debug" );
      } else {
        const res = await this.db.collection(_path).add(_data);
        this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + res.id, "debug" );
      }
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }
  
  async db_delete(_path, _id){
    try {
      const doc = this.db.collection(_path).doc(_id);
      const docSnapshot = await doc.get();
      if (docSnapshot.exists) {
        await doc.delete();
        this.logger.log(this.settings.locale.console.db_delete_pass + _path + "/" + _id, "debug" );
      } else {
        this.logger.log(this.settings.locale.console.db_delete_fail + _path + "/" + _id, "debug" );
      }
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }

  async start() {
    this.logger.log("Firebase initialized", "info");
    const startTime = admin.firestore.Timestamp.fromDate(new Date());
    const data = {
      start_time: startTime,
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      uptime: os.uptime(),
      version: os.version()
    };
    await this.db_push(this.settings.path.db.session, data, startTime.toDate().toISOString());
  }

  async getObjectByPath(_target, _search) {
    let parts = _search.split('/');
    let _targetCopy = _target;

    for (let part of parts) {
        if (_targetCopy[part] === undefined) {
            return undefined;
        }
        _targetCopy = _targetCopy[part];
    }

    return _targetCopy;
  }
}

module.exports = DB;
