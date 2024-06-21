module.exports = class C_BONUS {
    async run(_msg, _app, _params) {
        try {
            let _user = await _app.db.db_user(_msg);
            if (!_user) return false;

            
            if (_params?.length === 0) { 
                return await this.claim(_msg, _app);
            }
            else {
                return await this.parseParams(_msg, _app, _params);
            }
        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async parseParams(_msg, _app, _params) {
        try {
            if (! await _app.FUNCTIONS.is_admin(_app, _msg)) { 
                    _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_noadmin, _msg.message_id);
                    return true;
                }

            _app.logger.log(`/bonus input params: ${_params}`, "info");
            // if first param is 
            // "level": "/stats/level",
            // "balance": "/wallet/balance",
            // "ticket": "/wallet/ticket",
            // "collectible": "/wallet/collectible/",
            // "achievement": "/achievement/"
            // then go to exact method and pass rest of params

            // params should go as [0] = "type", [1] = user id, [2] = amount/reward id, [3] = rarity
            if (!_params[0]) {
                _app.logger.log(`Type not found in params`, "info");
                _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_e_notype, _msg.message_id);
                return false;
            }           
            
            if (_params[0] == "exp" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "level" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "ticket" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "mes" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "col" && _params[1] && _params[2] && _params[3]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], 1, _params[2], _params[3]); }
            else {
                _app.logger.log(`No knows type found in params`, "info");
                return false;
            }

        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    } 

    async bonus_new(_msg, _app, _type, _userid, _amount, _id, _rarity)
    {     
        if (!_type || !_userid || !_amount) {
            _app.logger.log(`Type/User/Amount/id, rarity not found in params`, "info");
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_e_notype, _msg.message_id);
            return false;
        }  

        let _bonus = _app.SETTINGS.model.bonus;
        let _message = _app.SETTINGS.locale.base.cmd_bonus_exp_success;

        _bonus.type = _type;        
        _bonus.user = _userid;
        _bonus.amount = _amount || 1;        
        _message +=  `\n[NEW][${_userid}][${_type}][${_amount}]`;
        if(_id){
            _bonus.id = _id;
            _message += `[${_id}]`;
        }
        if (_rarity){
            _bonus.rarity = _rarity;
            _message += `[${_rarity}]`;
        }   
        _bonus.time = await _app.db.time();
        

        _app.db.push(_app.SETTINGS.path.db.bonus + _userid, _bonus);
        _app.bot.sendMessage(_msg.chat.id, _message, _msg.message_id);
        _app.logger.log(`Created bonus ${_amount}x[${_msg.from.id}][${_type}][${_id}][${_rarity}]`, "info");

        return true;
    }

    async claim(_msg, _app)
    {        
        const { logger, bot, SETTINGS, FUNCTIONS } = _app;
        
        let _message = "";
        let _counter = 0;
        const _userRewards = await _app.db.get(_app.SETTINGS.path.db.bonus + _msg.from.id);

        if (!_userRewards) {
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_none, _msg.message_id);
            return true;
        }

        for (const key in _userRewards) {
            const { type, user, amount, id, rarity } = _userRewards[key];

            if (!type || !user || !amount) {
                _app.logger.log(`Invalid reward: ${JSON.stringify(_userRewards[key])}`, "debug");                
                return false;
            } else {
                _app.logger.log(`Reward: ${JSON.stringify(_userRewards[key])}`, "debug");
            }

            _app.logger.log(`Claiming reward: [${type}][${user}][${amount}][${id}][${rarity}]`, "debug");

            switch (type) {
                case "exp":
                    if (await _app.FUNCTIONS.exp_add(_app, user, amount)){
                        _message += `\n🎁 [${_counter}] Experience bonus: ${[amount]}`;                        
                        _counter++;
                    }
                    break;
                case "level":
                    if(await FUNCTIONS.level_add (_app, user, amount)){
                        _message += `\n🎁 [${_counter}] Level bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "ticket":
                    if(await _app.FUNCTIONS.ticket_add (_app, user, amount)){
                        _message += `\n🎁 [${_counter}] Ticket bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "mes":
                    if (await _app.FUNCTIONS.messages_add (_app, user, amount)){
                        _message += `\n🎁 [${_counter}] Message bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "col":
                    let _record = await _app.FUNCTIONS.collection_add(_app, user, id, rarity)
                    if (_record) {
                        await _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_col_recieved + _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text), _msg.message_id)
                        _message += `\n🎁 [${_counter}] Collection bonus: ${[amount]}`; 
                        _counter++;
                    } else {
                        _message += `\n🎁 [${_counter}] ${_app.HELPER.str_style("Broken bonus:", "strikethrough")} DELETED`; 
                        _counter++;
                    }
                    break;
                default:
                    _app.logger.log(`Unknown type: ${type}`, "debug");
                    return false;
            }

            if (_counter > 0) {
                _app.logger.log(`Claimed reward: ${JSON.stringify(_userRewards[key])}`, "debug");
                await _app.db.delete(_app.SETTINGS.path.db.bonus + user + "/" + key);
            }
        }
        _app.logger.log(`Claimed rewards: ${_counter}`, "debug");
        await _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_success +_message, _msg.message_id);      
        return true;  
    }
}