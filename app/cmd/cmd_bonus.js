let APP;
module.exports = class C_BONUS {    
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_BONUS constructed", "info");
    }
    async run(_msg, _params) {
        try {
            let _user = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id);
            if (!_user) return false;

            
            if (_params?.length === 0) { 
                return await this.claim(_msg);
            }
            else {
                return await this.parseParams(_msg, _params);
            }
        } catch (error) {
            APP.LOGGER.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async parseParams(_msg, _params) {
        try {
            if (! await APP.FUNCTIONS.is_admin(_msg)) { 
                APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_noadmin, _msg.message_id);
                    return true;
                }

                APP.LOGGER.log(`/bonus input params: ${_params}`, "info");
            // if first param is 
            // "level": "/stats/level",
            // "balance": "/wallet/balance",
            // "ticket": "/wallet/ticket",
            // "collectible": "/wallet/collectible/",
            // "achievement": "/achievement/"
            // then go to exact method and pass rest of params

            // params should go as [0] = "type", [1] = user id, [2] = amount/reward id, [3] = rarity
            if (!_params[0]) {
                APP.LOGGER.log(`Type not found in params`, "info");
                APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_bonus_e_notype, _msg.message_id);
                return false;
            }           
            
            if (_params[0] == "exp" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "level" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "ticket" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "mes" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "col" && _params[1] && _params[2] && _params[3]) { return await this.bonus_new(_msg, _params[0], _params[1], 1, _params[2], _params[3]); }
            else {
                APP.LOGGER.log(`No knows type found in params`, "info");
                return false;
            }

        } catch (error) {
            APP.LOGGER.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    } 

    async bonus_new(_msg, _type, _userid, _amount, _id, _rarity)
    {     
        if (!_type || !_userid || !_amount) {
            APP.LOGGER.log(`Type/User/Amount/id, rarity not found in params`, "info");
            APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_bonus_exp_e_notype, _msg.message_id);
            return false;
        }  

        let _bonus = APP.SETTINGS.model.bonus;
        let _message = APP.SETTINGS.locale.base.cmd_bonus_exp_success;

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
        _bonus.time = await APP.DB.time();
        

        APP.DB.push(APP.SETTINGS.path.db.bonus + _userid, _bonus);
        APP.BOT.sendMessage(_msg.chat.id, _message, _msg.message_id);
        APP.LOGGER.log(`Created bonus ${_amount}x[${_msg.from.id}][${_type}][${_id}][${_rarity}]`, "info");

        return true;
    }

    async claim(_msg)
    {     
        let _message = "";
        let _counter = 0;
        const _userRewards = await APP.DB.get(APP.SETTINGS.path.db.bonus + _msg.from.id);

        if (!_userRewards) {
            APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_bonus_none, _msg.message_id);
            return true;
        }

        for (const key in _userRewards) {
            const { type, user, amount, id, rarity } = _userRewards[key];

            if (!type || !user || !amount) {
                APP.LOGGER.log(`Invalid reward: ${JSON.stringify(_userRewards[key])}`, "debug");                
                return false;
            } else {
                APP.LOGGER.log(`Reward: ${JSON.stringify(_userRewards[key])}`, "debug");
            }

            APP.LOGGER.log(`Claiming reward: [${type}][${user}][${amount}][${id}][${rarity}]`, "debug");

            switch (type) {
                case "exp":
                    if (await APP.FUNCTIONS.exp_add(user, amount)){
                        _message += `\n🎁 [${_counter}] Experience bonus: ${[amount]}`;                        
                        _counter++;
                    }
                    break;
                case "level":
                    if(await APP.FUNCTIONS.level_add (user, amount)){
                        _message += `\n🎁 [${_counter}] Level bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "ticket":
                    if(await APP.FUNCTIONS.ticket_add (user, amount)){
                        _message += `\n🎁 [${_counter}] Ticket bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "mes":
                    if (await APP.FUNCTIONS.messages_add (user, amount)){
                        _message += `\n🎁 [${_counter}] Message bonus: ${[amount]}`; 
                        _counter++;
                    }
                    break;
                case "col":
                    let _record = await APP.FUNCTIONS.collection_add(user, id, rarity)
                    if (_record) {
                        await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_bonus_col_recieved + APP.HELPER.reward_record_style(_record, APP.SETTINGS.rarity[_record.rarity].text), _msg.message_id)
                        _message += `\n🎁 [${_counter}] Collection bonus: ${[amount]}`; 
                        _counter++;
                    } else {
                        _message += `\n🎁 [${_counter}] ${APP.HELPER.str_style("Broken bonus:", "strikethrough")} DELETED`; 
                        _counter++;
                    }
                    break;
                default:
                    APP.LOGGER.log(`Unknown type: ${type}`, "debug");
                    return false;
            }

            if (_counter > 0) {
                APP.LOGGER.log(`Claimed reward: ${JSON.stringify(_userRewards[key])}`, "debug");
                await APP.DB.delete(APP.SETTINGS.path.db.bonus + user + "/" + key);
            }
        }
        APP.LOGGER.log(`Claimed rewards: ${_counter}`, "debug");
        await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_bonus_success +_message, _msg.message_id);      
        return true;  
    }
}