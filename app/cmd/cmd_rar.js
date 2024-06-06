module.exports = class CMD_RAR{
    async run(_msg, _app) {        
        try {
            const rarities = Object.keys(_app.SETTINGS.rarity).map(rarity => `${_app.HELPER.str_style(rarity, _app.SETTINGS.rarity[rarity] && _app.SETTINGS.rarity[rarity].text || "")}: ${this.getRewardCountByRarity(_app, rarity).toString()}`).join("\n");
            await _app.bot.sendMessage(_msg.chat.id, `Rarity list:\n${rarities}`, _msg.message_id);
            return true;
        } catch (error) {
            _app.logger.log(`Error executing cmd_rar: ${error.stack}`, "error");
            return false;
        }        
    }

    getRewardCountByRarity(_app, _rarity) {
        let data = _app.COLLECTIBLES;
        let result = 0;
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                if (element.rarity == _rarity) {
                    result = result ? result + 1 : 1;
                }
            }
        }
        return result;
    }
}

