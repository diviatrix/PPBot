let APP;
module.exports = class C_DELETEME{
    constructor (_app) {
        APP = _app;
        APP.LOGGER.log('C_DELETEME constructed', "debug");
    }
    async run (_msg) {
        try {
            if (!await APP.DB.exist(APP.SETTINGS.path.db.users + _msg.from.id)) {
                return;
            } else {
                await APP.DB.delete(APP.SETTINGS.path.db.users + _msg.from.id);
                await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_deleteme_pass, _msg.message_id);
                APP.LOGGER.log("Command completed: "  + _msg.from.id, "info");
            }
        } catch (error) {
            APP.LOGGER.log(`Error executing cmd_deleteme: ${error.stack}`, "error");
        }
    }
}