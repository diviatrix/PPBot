let APP;
module.exports = class C_GO{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log('C_GO constructed', "debug");
    }
    async run(_msg) {
        try {
            if (!await APP.DB.exist(APP.SETTINGS.path.db.users + _msg.from.id)) {
                let user = APP.SETTINGS.model.user;
        
                user.id = _msg.from.id;
                user.username = _msg.from.username || "";
                user.first_name = _msg.from.first_name || "";
                user.last_name = _msg.from.last_name || "";
                user.stats = APP.SETTINGS.model.stats;
                user.stats.register = {
                  chatId: _msg.chat.id || _msg.from.id,
                  time: await APP.DB.time()
                };
        
                await APP.DB.set(APP.SETTINGS.path.db.users + user.id, user);
        
                await APP.LOGGER.log("Successfully registered user: " +  _msg.from.id, "info");
                await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_go_pass, _msg.message_id);
                await APP.ACHIEVEMENT.h_register(_msg, user, APP);
                return true;
            }
            else {                
                await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_go_fail, _msg.message_id);
            }
        } catch (error) {
            await APP.LOGGER.log(`Error executing cmd_go.run: ${error.stack}`, "error");
            return false;
        }
    }
}