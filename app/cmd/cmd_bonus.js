module.exports = class C_BONUS {
    async run(_msg, _app, _params) {
        try {
            let _user = await _app.db.db_user(_msg);
            if (!_user) return false;
            if (!_params[1]) this.b_claim(_msg, _app);
            else await this.parseParams(_msg, _app, _params, _user);

            return true;
        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async parseParams(_msg, _app, _params, _user) {
        try {
            _app.logger.log(`/bonus input params: ${_params}`, "info");
            // if first param is 
            // "experience": "/stats/experience",
            // "level": "/stats/level",
            // "balance": "/wallet/balance",
            // "ticket": "/wallet/ticket",
            // "collectible": "/wallet/collectible/",
            // "achievement": "/achievement/"
            // then go to exact method and pass rest of params

            // params should go as [0] = "type", [1] = amount/reward id
            if (!_params[0]) {
                _app.logger.log(`Type not found in params`, "info");
                _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_e_notype, _msg.message_id);
                return false;
            }

            if (!await _app.FUNCTIONS.is_admin(_app, _msg)) return _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_noadmin, _msg.message_id);
            
            if (_params[0] == "exp" && _params[1] && _params[2]) {
                return await this.b_experience(_msg, _app, _params[1], Number(_params[2]));
            }
        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async 

    async b_experience(_msg, _app, _id, _amount)
    {
        // _param 0 = type
        // _param 1 = user id
        // _param 2 = amount
        
        if (!_params[1]) {
            _app.logger.log(`User ID not found in params`, "info");
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_e_noid, _msg.message_id);
            return false;
        }

        if (!_params[2]) {
            _app.logger.log(`Amount not found in params`, "info");
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_e_noval, _msg.message_id);
            return false;
        }

        let _userExp = await _app.db.get(_app.SETTINGS.path.db.users + _id + _app.SETTINGS.path.db.user.experience);
        let _bonus = _app.SETTINGS.model.bonus;
        _userExp = Number(_userExp) || 0;        
        _userExp = _userExp + _amount;

        _bonus.type = "exp";
        _bonus.user = _id;
        _bonus.amount = _amount;
        _bonus.time = await _app.db.time();
        _app.db.push(_app.SETTINGS.path.db.bonus, _bonus);

        //_app.db.set(_app.SETTINGS.path.db.users + _id + _app.SETTINGS.path.db.user.experience, Number(_userExp));
        _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_exp_success +" user: " + _msg.from.id + " amount: " + _params[2] + " experience: " + _userExp, _msg.message_id);

        _app.logger.log(`Added ${_amount} experience to user: ${_msg.from.id}`, "info");

        return _userExp;

    }

    async b_claim(_msg, _app)
    {
        try {
            // get bonus list for user from database
            // let _bonusObject = await _app.db.get(_app.SETTINGS.path.db.bonus);
            let _bonusObject = await _app.CACHE.get(_app.SETTINGS.path.db.bonus);
            _app.logger.log(`_bonusObject: ${JSON.stringify(_bonusObject, null, 2)}`, "debug");
            let _rewardList = [];

            // select items from object where id = _msg.from.id
            for (const key in _bonusObject) {
                if (_bonusObject.hasOwnProperty(key)) {
                    const _item = _bonusObject[key];
                    if (_item.user == _msg.from.id) {
                        _rewardList.push(_item);
                        _app.logger.log(`Found bonus for user: ${_item.time} ${_item.type}, ${_item.amount} in _bonusObject`, "debug");
                    }
                }
            }

            if(_rewardList[0]) {
                _app.logger.log(`_rewardList: ${JSON.stringify(_rewardList, null, 2)}`, "debug");
                return true;
            }
            else {
                _app.logger.log(`No rewards found for user: ${_msg.from.id}`, "debug");
                _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_bonus_fail, _msg.message_id);
                return true;
            }
        } catch (error) {
            _app.logger.log(`Error executing b_claim: ${error.stack}`, "error");
            return false;
        }
    }
}