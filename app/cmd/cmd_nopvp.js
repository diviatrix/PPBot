module.exports = class C_NOPVP{
    async run(_msg, _app) {
        const user = await _app.db.get(_app.SETTINGS.path.db.users + _msg.from.id);

        if (!user) 
        {
            _app.commands.msg_notRegistered(_msg);
            return true;
        }

        _app.logger.log("Starting cmd_nopvp", "info");

        if (!user.settings) user.settings = { nopvp: false };
        else if (user.settings.nopvp === undefined) user.settings.nopvp = false;

        user.settings.nopvp = !user.settings.nopvp;
        await _app.db.set(_app.SETTINGS.path.db.users + _msg.from.id, user);

        await _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_nopvp + (user.settings.nopvp ? "enabled" : "disabled"), _msg.message_id);

        return true;
    }
}