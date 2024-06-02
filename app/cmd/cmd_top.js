let app;
class C_TOP {
    async run(_msg, _app, _params) {
        app = _app
        let dailyrewards = await app.db.get(app.SETTINGS.path.db.stats.dailyrewards);
        
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
        app.logger.log(`Records of daily rewards in db: ${Object.keys(dailyrewards).length}`, "debug");
        for (const key in dailyrewards) {
            if (_count >= 10) { break; }

            let _item = dailyrewards[key];
            if (_item && _item.id) {
                _message += `[${_item.usernickname}]` + app.HELPER.str_style(`[${_item.id}][${_item.rarity}][${_item.name}]`, app.SETTINGS.rarity[_item.rarity].text) + "\n";
            }

           
            _count++;
        }

        app.bot.sendMessage(_msg.chat.id, app.SETTINGS.locale.base.cmd_top + "\n" + _message, _msg.message_id);


        return true;
    }
}
module.exports = C_TOP