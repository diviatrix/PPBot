const admin = require('firebase-admin');

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
    user.log = this.settings.model.log;
    user.log.account.time_register = admin.firestore.Timestamp.fromDate(new Date());
    await this.db.collection(this.settings.path.db.users).doc(user.id.toString()).set(user);
    return true;
  }

  async db_user_erase(msg)
  {
    let userRef = this.db.collection(this.settings.path.db.users).doc(msg.from.id.toString());
    userRef.delete().then(() => { this.logger.log(`${this.settings.locale.console.db_user_erase_pass} ${msg.from.id}`, "info"); }).catch((error) => { this.logger.log(`${this.settings.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error"); });
  }

  async db_user_isRegistered(msg){
    const userRef = this.db.collection(this.settings.path.db.users).doc(msg.from.id.toString());
    const userSnapshot = await userRef.get();
    const userExists = userSnapshot.exists;
    const logMessage = userExists ? this.settings.locale.console.db_user_exists : this.settings.locale.console.db_user_not_exists;
    this.logger.log(logMessage + msg.from.id, "info");
    return userExists;
  }

  async db_push(_path, _data){
    const res = await this.db.collection(_path).add(_data);
    this.logger.log(this.settings.locale.console.db_write_pass + _path + "/" + res.id, "info" );
  }

  async start() {
    this.logger.log("Firebase initialized", "info");
    const data = {
      start_time: admin.firestore.Timestamp.fromDate(new Date()),
    };
    await this.db_push(this.settings.path.db.session, data);
  }
}

module.exports = DB;
