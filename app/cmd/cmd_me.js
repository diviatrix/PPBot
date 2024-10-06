let APP;
module.exports = class CMD_ME{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("CMD_ME constructed", "info");
    }
    async run(_msg)
    {
        try
        {
            if (!await APP.FUNCTIONS.is_registered(_msg)) { APP.COMMANDS.msg_notRegistered(_msg); return;} 

            // read user data from db
            const user = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id);

            if (!user.stats) user.stats = {};
            const { level = 0, experience = 0, messages = 0, roll: { count = 0 } = {} } = user.stats;
            const { ticket = 0, collectible = {} } = user.wallet;
            const achievement = user.achievement || {};            
            const _topReward = await this.top_item_of_collection_by_id(collectible);

            let message = APP.SETTINGS.locale.base.cmd_me_pass + "\n";
            message += `${APP.SETTINGS.locale.base.cmd_me_level} ${level}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_exp} ${experience}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_ticket} ${ticket}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_messages} ${messages}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_rolls} ${count}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_COLLECTIBLES} ${Object.keys(collectible).length}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_achievements} ${Object.keys(achievement).length}\n`;
            message += `${APP.SETTINGS.locale.base.cmd_me_biggest_id} ${_topReward? APP.HELPER.str_style(`[${_topReward.id}][${_topReward.rarity}][${_topReward.name}]`, APP.SETTINGS.rarity[_topReward.rarity] && APP.SETTINGS.rarity[_topReward.rarity].text || "") : "None"}\n`;
            
            const _lastRoll = user.stats.roll.last;
            
            if (_lastRoll) {
                message += APP.SETTINGS.locale.base.cmd_me_last_roll;
                message += APP.HELPER.str_style(`[${_lastRoll.id}][${_lastRoll.rarity}][${_lastRoll.name}]`, APP.SETTINGS.rarity[_lastRoll.rarity] && APP.SETTINGS.rarity[_lastRoll.rarity].text || "") || "None";
                message += "\n";
            }

            APP.BOT.sendMessage(_msg.chat.id,message, _msg.message_id);                
        }
        catch (error)
        {
            APP.LOGGER.log(`Error executing cmd_me.run: ${error.stack}`, "error");
        }
    }

    async top_item_of_collection_by_id(_collection)// recieves user.wallet.collectible
    {
        if (!_collection) return null;
        
        let _top = {"id":0};
        for (const key in _collection) {
            let _item;
            if (Object.prototype.hasOwnProperty.call(_collection, key)) {
                _item = _collection[key];
                if (_item) {
                    if (await APP.FUNCTIONS.power(_item) > await APP.FUNCTIONS.power(_top)) {
                        _top = _item
                    }
                }
            }
        }
        return _top;
    }
}
