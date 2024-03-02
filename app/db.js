const Logger = require('./logger.js');
const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");
const { getFirestore, doc, getDoc, setDoc, collection, addDoc, Timestamp } = require("firebase/firestore");

let logger = new Logger();

class DB {
  constructor(_settings) {
    try {
      this.app = initializeApp(_settings.firebaseConfig);
      this.db = getFirestore(this.app);
      this.settings = _settings;
      if (getAnalytics.isSupported) {
        this.analytics = getAnalytics(this.app);
      }
      this.start();
    } catch (error) {
      logger.log(error, "error");
    }
  }

  async db_session_write(){
    const data = {
      start_time: Timestamp.fromDate(new Date()),
    };
    const res = addDoc(collection(this.db, this.settings.path.db.session), data).id;
    logger.log(this.settings.locale.console.db_write_pass + JSON.stringify(res, null, 2), "info" );
  }

  // very dangerous : write to db without checking if user is registered
  async db_user_write(msg)
  {
    const user = this.settings.model.user;
    user.id = msg.from.id;
    user.username = msg.from.username;
    user.first_name = msg.from.first_name || "";
    user.last_name = msg.from.last_name || "";
    user.chatId = msg.chat.id;
    user.log = this.settings.model.log;
    user.log.account.time_register = Timestamp.fromDate(new Date());
    await setDoc(doc(this.db, this.settings.path.db.users, user.id.toString()), user);
    return true;
  }

  async db_user_erase(msg)
  {
    // delete record in database
    let userRef = this.db.collection(this.settings.path.db.users).doc(msg.from.id.toString());
    userRef.delete().then(() => { logger.log(`${this.settings.locale.console.db_user_erase_pass} ${msg.from.id}`, "info"); }).catch((error) => { logger.log(`${this.settings.locale.console.db_user_erase_fail} ${msg.from.id} : ${error}`, "error"); });
  }

  async db_user_isRegistered(msg){
    const userRef = doc(this.db, this.settings.path.db.users, msg.from.id.toString());
    const userSnapshot = await getDoc(userRef);
    const userExists = userSnapshot.exists();
    const logMessage = userExists ? this.settings.locale.console.db_user_exists : this.settings.locale.console.db_user_not_exists;
    logger.log(logMessage, "info");
    return userExists;
  }


  async start() {
    logger.log("Firebase initialized", "info");
    //logger.log(JSON.stringify(this.db, null, 2), "info");
    this.db_session_write();
  }

  
}

module.exports = DB;
