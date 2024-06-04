module.exports = class C_BONUS {
    async run(_msg, _app, _params) {
        try {
            let _user = await _app.db.db_user(_msg);
            if (!_user) return false;
            let _is_admin = await _app.FUNCTIONS.is_admin(_app, _msg);
            if (_params?.length == 0) {
                let _userRewards = await this.b_check_rewards(_msg, _app);
                if(_userRewards?.length > 0) {
                    await this.claim(_msg, _app, _userRewards);
                    return true;
                }
                else {
                    _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_none, _msg.message_id);
                    return true;
                }
            }
            else if (_is_admin){
                await this.parseParams(_msg, _app, _params, _is_admin);
                return true;
            }
        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async parseParams(_msg, _app, _params, _is_admin) {
        try {
            if (!_is_admin) return _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_noadmin, _msg.message_id);

            _app.logger.log(`/bonus input params: ${_params}`, "info");
            // if first param is 
            // "level": "/stats/level",
            // "balance": "/wallet/balance",
            // "ticket": "/wallet/ticket",
            // "collectible": "/wallet/collectible/",
            // "achievement": "/achievement/"
            // then go to exact method and pass rest of params

            // params should go as [0] = "type", [1] = user id, [2] = amount/reward id
            if (!_params[0]) {
                _app.logger.log(`Type not found in params`, "info");
                _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_e_notype, _msg.message_id);
                return false;
            }           
            
            if (_params[0] == "exp" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "level" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "ticket" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else if (_params[0] == "mes" && _params[1] && _params[2]) { return await this.bonus_new(_msg, _app, _params[0], _params[1], Number(_params[2])); }
            else {
                _app.logger.log(`No knows type found in params`, "info");
                _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_e, _msg.message_id);
                return false;
            }

        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    } 

    async bonus_new(_msg, _app, _type, _userid, _amount_id)
    {     
        if (!_type || !_userid || !_amount_id) {
            _app.logger.log(`Type/User/Amount not found in params`, "info");
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_e_notype, _msg.message_id);
            return false;
        }  

        let _bonus = _app.SETTINGS.model.bonus;

        _bonus.type = _type;
        _bonus.user = _userid;
        _bonus.amount = _amount_id;
        _bonus.time = await _app.db.time();

        _app.db.push(_app.SETTINGS.path.db.bonus, _bonus);
        _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_success + `\n[${_msg.from.id}][${_type}][${_amount_id}]`, _msg.message_id);
        _app.logger.log(`Created bonus [${_msg.from.id}][${_type}][${_amount_id}]`, "info");

        return true;
    }

    async claim(_msg, _app, _userRewards)
    {
        let _message = "";

        for (const key in _userRewards) {
            if (_userRewards.hasOwnProperty(key)) {
                let _result = false;
                if (_userRewards[key].type == "exp") {
                    await _app.FUNCTIONS.exp_add(_app, _userRewards[key].user, _userRewards[key].amount);
                    _message += "\n🎁 " + _userRewards[key].type + ": " + _userRewards[key].amount;
                    _result = true;
                } 
                else if (_userRewards[key].type == "level") {
                    await _app.FUNCTIONS.level_add (_app, _userRewards[key].user, _userRewards[key].amount);
                    _message += "\n🎁 " + _userRewards[key].type + ": " + _userRewards[key].amount;
                    _result = true;
                }
                else if (_userRewards[key].type == "ticket") {
                    await _app.FUNCTIONS.ticket_add (_app, _userRewards[key].user, _userRewards[key].amount);
                    _message += "\n🎁 " + _userRewards[key].type + ": " + _userRewards[key].amount;
                    _result = true;
                }
                else if (_userRewards[key].type == "mes") {
                    await _app.FUNCTIONS.messages_add (_app, _userRewards[key].user, _userRewards[key].amount);
                    _message += "\n🎁 " + _userRewards[key].type + ": " + _userRewards[key].amount;
                    _result = true;
                }

                if (_result) await _app.db.delete(_app.SETTINGS.path.db.bonus + _userRewards[key].id);
            }
        }
        _app.logger.log(`Claimed rewards: ${_userRewards.count}`, "debug");
        _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_success +_message, _msg.message_id);        
    }

    async b_check_rewards(_msg, _app)
    {
        try {
            let _bonusObject = await _app.CACHE.update(_app.SETTINGS.path.db.bonus);
            let _rewardList = [];

            for (const key in _bonusObject) {
                if (_bonusObject.hasOwnProperty(key)) {
                    const _item = _bonusObject[key];
                    if (_item.user == _msg.from.id) {
                        _rewardList.push(_item);
                        _app.logger.log(`Found bonus for user: ${_item.time} ${_item.type}, ${_item.amount} in _bonusObject`, "debug");
                    }
                }
            }

            if(_rewardList?.length > 0) {
                _app.logger.log(`Found ${_rewardList.length} rewards for user: ${_msg.from.id}`, "debug");
                return _rewardList;
            }
            else {
                _app.logger.log(`No rewards found for user: ${_msg.from.id}`, "debug");
                return false;
            }
        } catch (error) {
            _app.logger.log(`Error executing b_claim: ${error.stack}`, "error");
            return false;
        }
    }

    async give_reward(_msg, _app, _reward){

        // recieves reward
        // checks type etc
        // gives reward, record to db
        // send message to user
    }
}