let APP;
module.exports = class C_TOP {
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_TOP constructed", "debug");
    }
    async run(_msg, _params) {
        let dailyrewards = await APP.DB.get(APP.SETTINGS.path.db.stats.dailyrewards);
        
        if (!dailyrewards) { return false; }

        // sort dailyreward keys by item.id
        dailyrewards = Object.keys(dailyrewards).sort((a, b) => {
            return dailyrewards[b].id - dailyrewards[a].id;
        }).reduce(
            (obj, key) => {
                obj[key] = dailyrewards[key];
                return obj;
            },
            {}
        );

        // prepare message with top 10
        let _message = "";
        let _count = 0;
        APP.LOGGER.log(`Records of daily rewards in db: ${Object.keys(dailyrewards).length}`, "debug");
        for (const key in dailyrewards) {
            if (_count >= 10) { break; }

            let _item = dailyrewards[key];
            if (_item && _item.id) {
                _message += `[${_item.usernickname}]` +APP.HELPER.str_style(`[${_item.id}][${_item.rarity}][${_item.name}]`,APP.SETTINGS.rarity[_item.rarity].text) + "\n";
            }

           
            _count++;
        }

       APP.BOT.sendMessage(_msg.chat.id,APP.SETTINGS.locale.base.cmd_top + "\n" + _message, _msg.message_id);


        return true;
    }
}