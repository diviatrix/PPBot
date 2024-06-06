module.exports = class CMD_RAR{
    async run(_msg, _app) {        
        try {
            const rarities = Object.keys(_app.SETTINGS.rarity).map(rarity => `${_app.HELPER.str_style(rarity, _app.SETTINGS.rarity[rarity] && _app.SETTINGS.rarity[rarity].text || "")}: ${this.getRewardCountByRarity(_app, rarity).toString()}`).join("\n");
            let _message = `Rarity list:\n${rarities})}`;
            _message += "\n\nAll collectibles:\n" + _app.HELPER.str_style("https://github.com/diviatrix/PPBot/blob/baza/app/storage/collectible.json", "italic");
            await _app.bot.sendMessage(_msg.chat.id, _message , _msg.message_id);
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

