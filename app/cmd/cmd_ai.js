let APP;
module.exports = class C_AI{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_AI constructed", "info");
    }
    async run(_msg, prompt) {
        if (!await APP.DB.exist(APP.SETTINGS.path.db.users + _msg.from.id)) 
        {
            APP.COMMANDS.msg_notRegistered(_msg);
            return true;
        } 
        else {
            APP.LOGGER.log("Starting cmd_g with prompt: " + prompt, "info");
            var reply = await APP.GEMINI.handleRequest(prompt);
            
            if (reply) {
                await APP.BOT.sendMessage(_msg.chat.id, reply, _msg.message_id);
                return reply;
            }            
        }        
    }
}