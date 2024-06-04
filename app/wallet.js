let app;
module.exports = class WALLET{
    constructor(_app) {
        app = _app;
    }

    // get wallet balance for user by _msg
    async balance(_msg) {
        let user = await app.db.db_user(_msg);
        if (!user) {
            app.bot.sendMessage(_msg.chat.id, `${_msg.from.first_name}, ${app.SETTINGS.locale.base.cmd_wallet_e_nouser}`, _msg.message_id);
            return false;

        }
        return user.wallet.balance;
    }
}