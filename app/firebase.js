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
      this.logger.log(error, "error");
    }
  }

  async db_user_write(msg)
  {
    const user = this.settings.model.user;
    user.id = msg.from.id;
    user.username = msg.from.username;
    user.first_name = msg.from.first_name || "";
    user.last_name = msg.from.last_name || "";
    user.chatId = msg.chat.id;
    user.stats = this.settings.model.stats;
    await this.setObjectByPath(user, this.settings.path.db.user.time_register, admin.firestore.Timestamp.fromDate(new Date()));
    //user.stats.account.time_register = admin.firestore.Timestamp.fromDate(new Date());
    await this.db_push(this.settings.path.db.users, user, user.id.toString());
    return true;
  }

  async db_user_erase(msg) {
    try {
      await this.db_delete(this.settings.path.db.users, msg.from.id.toString());
      this.logger.log(`${this.settings.locale.console.db_user_erase_pass} ${msg.from.id}`, "info");
    } catch (error) {
      this.logger.log(`${this.settings.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error");
    }
  }

  async db_user_isRegistered(msg){
    const userRef = this.db.collection(this.settings.path.db.users).doc(msg.from.id.toString());
    const userSnapshot = await userRef.get();
    const userExists = userSnapshot.exists;
    const logMessage = userExists ? this.settings.locale.console.db_user_exists : this.settings.locale.console.db_user_not_exists;
    this.logger.log(logMessage + msg.from.id, "info");
    return userExists;
  }

  async db_push(_path, _data, _id){
    if (_id) {
      await this.db.collection(_path).doc(_id).set(_data);
      this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + _id, "info" );
    } else {
      const res = await this.db.collection(_path).add(_data);
      this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + res.id, "info" );
    }
  }
  async db_delete(_path, _id){
    const doc = this.db.collection(_path).doc(_id);
    const docSnapshot = await doc.get();
    if (docSnapshot.exists) {
      await doc.delete();
      this.logger.log(this.settings.locale.console.db_delete_pass + _path + "/" + _id, "info" );
    } else {
      this.logger.log(this.settings.locale.console.db_delete_fail + _path + "/" + _id, "info" );
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
    let current = _target;

    for (let part of parts) {
        if (current[part] === undefined) {
            return undefined;
        }
        current = current[part];
    }

    return current;
  }

  async setObjectByPath(_target, _path, _value) {
    let parts = _path.split('/');
    let current = _target;

    for (let i = 0; i < parts.length; i++) {
      // If we're at the last part of the path, set the value
      if (i === parts.length - 1) {
          current[parts[i]] = _value;
      } else {
          // If the next part of the path doesn't exist in the object, create an empty object
          if (current[parts[i]] === undefined) {
              current[parts[i]] = {};
          }
          // Move to the next part of the path
          current = current[parts[i]];
      }
    }
  }
}

module.exports = DB;
