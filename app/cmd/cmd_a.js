module.exports = class C_A{
    async run(_msg, _app) {
        
        if (await _app.FUNCTIONS.is_admin(_app, _msg) == true) {
            _app.bot.sendSticker(_msg.chat.id, "CAACAgIAAx0CbqkL4wACCqpmXy_UQu5ow7aqruu--2plT47PkwACbwIAAn_hZQdtNARGzVqwFTUE", _msg.message_id );
        }
        else {
            _app.bot.sendSticker(_msg.chat.id, "CAACAgIAAxkBAAIVjmYQB-i-D-81vrU9LO0tCBqoINBOAAKfPAAC9515SEkILFaNnfghNAQ", _msg.message_id );
        }
        
        return true;
    }
}