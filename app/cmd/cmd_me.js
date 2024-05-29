class CMD_ME{
    async run(_msg, _app)
    {
        try
        {
            if (!await _app.db.db_user_isRegistered(_msg)) 
                {
                    _app.commands.msg_notRegistered(_msg);
                    return;
                } 
                else {
                    // read user data from db
                    const user = await _app.db.db_user(_msg);
                    if (!user.stats) {
                    user.stats = { messages: 0 };}
                
                let message = _app.SETTINGS.locale.base.cmd_me_pass + "\n";
                message += _app.SETTINGS.locale.base.cmd_me_messages + (user.stats.messages || 0) + "\n";
                message += _app.SETTINGS.locale.base.cmd_me_rolls + (user.stats.roll.count || 0) + "\n";
                message += _app.SETTINGS.locale.base.cmd_me_achievements + (user.achievement? Object.keys(user.achievement).length : 0) + "\n";
                message += _app.SETTINGS.locale.base.cmd_me_biggest_id + (await this.top_id_of_collection(user.wallet.collectible, _app))  + "\n";
                const _lastRoll = user.stats.roll.last;
                message += _app.SETTINGS.locale.base.cmd_me_last_roll + (_lastRoll? _app.HELPER.str_style(`[${_lastRoll.id}][${_lastRoll.rarity}][${_lastRoll.name}]`, _app.SETTINGS.rarity[_lastRoll.rarity] && _app.SETTINGS.rarity[_lastRoll.rarity].text || "") : "None") + "\n";
                message += _app.SETTINGS.locale.base.cmd_me_COLLECTIBLES + (user.wallet && user.wallet.collectible? Object.keys(user.wallet.collectible).length : 0) + "\n";
        
                _app.tgBot.sendMessage(_msg.chat.id,message, _msg.message_id);
                }
        }
        catch (error)
        {
            _app.logger.log(`Error executing cmd_me.run: ${error.stack}`, "error");
        }
    }

    async top_id_of_collection(_collection, _app)// recieves user.wallet.collectible
    {
        let _topid = 0;
        for (const key in _collection) {
            let _item;
            if (_collection.hasOwnProperty(key)) {
                _item = _collection[key];
                if (_item && _item.id) {
                    if (_item.id > _topid) {
                        _app.logger.log(`${_item.id} > ${_topid}`, "debug");
                        _topid = Number(_item.id);
                    }
                }
            }
        }
        return _topid;
    }
}

module.exports = CMD_ME