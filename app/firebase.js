const admin = require('firebase-admin');
const os = require('os');

class FirebaseConnector {
  constructor(_app) {
    try {
      this.app = _app;
      this.settings = _app.settings;
      this.logger = _app.logger;
      admin.initializeApp({
        credential: admin.credential.cert(_app.settings.db.serviceAccount),
        databaseURL: _app.settings.db.databaseURL
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

  async db_user_push(_msg, _path, _value) {
    try {
      if (await this.db_user_isRegistered(_msg)) {
        const ref = this.db.ref(this.settings.path.db.users + "/" + _msg.from.id + _path);
        const snapshot = await ref.push(_value);
        this.logger.log(`Record pushed successfully with id: ${snapshot.key}`, "info");
        return true;
      }
      else { this.logger.log("User not found: " + _msg.from.id, "error"); return false; }
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
      return false;
    }
  }

  async incrementValue(refPath) {
    const ref = this.db.ref(refPath);
    await ref.transaction((currentValue) => {
        // Если currentValue еще не установлено, то оно будет равно 0
        return (currentValue || 0) + 1;
    }); 
  }

  async db_user_get(_msg, _path) {
    try {
      if (await this.db_user_isRegistered(_msg)) {
        const ref = this.db.ref(this.settings.path.db.users + "/" + _msg.from.id + _path);
        let data = await ref.once('value');
        return data.val();
      }
      else { this.logger.log("User not found: " + _msg.from.id, "error"); return undefined; }
    }  
    catch (error) {
      this.logger.log(error.stack, "error");
      return error;
    }
  }

  async db_user_set(_msg, _path, _value) {
    try {
      if (await this.db_user_isRegistered(_msg)) {
        const ref = this.db.ref(this.settings.path.db.users + "/" + _msg.from.id + _path);
        await ref.set(_value);
        this.logger.log(`Record set successfully at path: ${_path}`, "info");
        return true;
      }
      else { 
        this.logger.log("User not found: " + _msg.from.id, "error"); 
        return false; 
      }
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
      return false;
    }
  }

  async db_user_new_write(msg)
  {
    try {
      const user = this.settings.model.user;
      user.id = msg.from.id;
      user.username = msg.from.username || "";
      user.first_name = msg.from.first_name || "";
      user.last_name = msg.from.last_name || "";
      user.register = { chatId: msg.chat.id || msg.from.id, time : this.time() };
      await this.db.ref(this.settings.path.db.users + "/" + user.id).set(user);
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
      const user = await this.db_user(_msg);
      if (user.stats.messages) { messages = user.stats.messages; }
      return messages;
    } catch (e) {
      throw new Error("[DB] Can't get messages from user: " + e.stack);
    }
  }

  async db_user_erase(msg) {
    try {
      await this.db.ref(this.settings.path.db.users + "/" + msg.from.id).remove();
      this.logger.log(`${this.settings.locale.console.db_user_erase_pass} ${msg.from.id}`, "debug");
    } catch (error) {
      this.logger.log(`${this.settings.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error");
    }
  }

  async db_user(_msg)
  {
    try {
      const userRef = this.db.ref(this.settings.path.db.users + "/" + _msg.from.id);
      const userSnapshot = await userRef.once('value'); //this.logger.log(JSON.stringify(userSnapshot.val(), null, 2), "debug");
      return userSnapshot.val();       
    } 
    catch (error) {
      this.logger.log(error.stack, "error");
      return undefined;
    }
  }

  async db_user_isRegistered(msg){
    try {
      const userRef = this.db.ref(this.settings.path.db.users + "/" + msg.from.id);
      const userSnapshot = await userRef.once('value');
      const userExists = userSnapshot.exists();
      const logMessage = userExists ? this.settings.locale.console.db_user_exists : this.settings.locale.console.db_user_not_exists;
      this.logger.log(logMessage + msg.from.id, "debug");
      return userExists;
    } catch (error) {
      this.logger.log(error.stack, "error");
      return false;
    }
  }

  async db_push(_path, _data){
    try {
      const res = await this.db.ref(_path).push(_data);
      this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + res.key, "debug" );
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }

  async db_set(_path, _data)
  {
    try {
      await this.db.ref(_path).set(_data);
      this.logger.log(this.settings.locale.console.db_write_pass + _path, "debug" );
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }
  
  async db_delete(_path){
    try {
      await this.db.ref(_path).remove();
      this.logger.log(this.settings.locale.console.db_delete_pass + _path, "debug" );
    } catch (error) {
      this.logger.log(error.stack, "error");
    }
  }

  async start() {
    this.logger.log("Firebase initialized", "info");
    const data = {
      start_time: this.time(),
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      uptime: os.uptime(),
      version: os.version()
    };
    await this.db.ref(this.settings.path.db.session).push(data);
  }
}

module.exports = FirebaseConnector;
