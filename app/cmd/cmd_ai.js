module.exports = class C_AI{
    async run(_msg, prompt, _app) {
        if (!await _app.db.exist(_app.SETTINGS.path.db.users + _msg.from.id)) 
        {
            _app.commands.msg_notRegistered(_msg);
            return true;
        } 
        else {
            _app.logger.log("Starting cmd_g with prompt: " + prompt, "info");
            var reply = await _app.GEMINI.handleRequest(prompt);
            
            if (reply) {
                await _app.bot.sendMessage(_msg.chat.id, reply, _msg.message_id);
                return reply;
            }            
        }        
    }
}