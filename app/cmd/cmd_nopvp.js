let APP;
module.exports = class C_NOPVP{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_NOPVP constructed", "info");
    }
    async run(_msg) {
        const user = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id);

        if (!user) 
        {
            APP.COMMANDS.msg_notRegistered(_msg);
            return true;
        }

        APP.LOGGER.log("Starting cmd_nopvp", "info");

        if (!user.settings) user.settings = { nopvp: false };
        else if (user.settings.nopvp === undefined) user.settings.nopvp = false;

        user.settings.nopvp = !user.settings.nopvp;
        await APP.DB.set(APP.SETTINGS.path.db.users + _msg.from.id, user);

        await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_nopvp + (user.settings.nopvp ? "enabled" : "disabled"), _msg.message_id);

        return true;
    }
}