let APP;
module.exports = class C_A{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_A constructed", "debug");
    }
    async run(_msg) {
        
        if (await APP.FUNCTIONS.is_admin(_msg) == true) {
            APP.BOT.sendSticker(_msg.chat.id, "CAACAgIAAx0CbqkL4wACCqpmXy_UQu5ow7aqruu--2plT47PkwACbwIAAn_hZQdtNARGzVqwFTUE", _msg.message_id );
        }
        else {
            APP.BOT.sendSticker(_msg.chat.id, "CAACAgIAAxkBAAIVjmYQB-i-D-81vrU9LO0tCBqoINBOAAKfPAAC9515SEkILFaNnfghNAQ", _msg.message_id );
        }
        
        return true;
    }
}