let APP;
module.exports = class CMD_RAR{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("CMD_RAR constructed", "info");
    }
    async run(_msg) {        
        try {
            const rarities = Object.keys(APP.SETTINGS.rarity).map(rarity => `${APP.HELPER.str_style(rarity, APP.SETTINGS.rarity[rarity] && APP.SETTINGS.rarity[rarity].text || "")}: ${this.getRewardCountByRarity(rarity).toString()}`).join("\n");
            let _message = `Rarity list:\n${rarities})}`;
            _message += "\n\nAll collectibles: http://chura.ru:3003/pp"
            _message += "\n\nAlso All collectibles:\n" + APP.HELPER.str_style("https://github.com/diviatrix/PPBot/blob/baza/app/storage/collectible.json", "italic");
            await APP.BOT.sendMessage(_msg.chat.id, _message , _msg.message_id);
            return true;
        } catch (error) {
            APP.LOGGER.log(`Error executing cmd_rar: ${error.stack}`, "error");
            return false;
        }        
    }

    getRewardCountByRarity(_rarity) {
        let data = APP.COLLECTIBLES;
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

