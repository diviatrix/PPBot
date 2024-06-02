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
            _app.logger.log(`Bonus: ${_params}`, "info");
            // if first param is 
            // "experience": "/stats/experience",
            // "level": "/stats/level",
            // "balance": "/wallet/balance",
            // "ticket": "/wallet/ticket",
            // "collectible": "/wallet/collectible/",
            // "achievement": "/achievement/"
            // then go to exact method and pass rest of params

            // params should go as [0] = "type", [1] = amount/reward id
            if (_params && _params[0] == "exp" && _params[1]) {
                return await this.b_experience(_msg, _app, Number(_params[1]));
            }
        } catch (error) {
            _app.logger.log(`Error executing cmd_bonus: ${error.stack}`, "error");
            return false;
        }
    }

    async b_experience(_msg, _app, _amount, _user)
    {
        // add experience to user

    }

    async b_claim(_msg, _app)
    {
        try {
            // get bonus list for user from database
            // let _bonusObject = await _app.db.db_get(_app.SETTINGS.path.db.bonus);
            let _bonusObject = await _app.CACHE.get(_app.SETTINGS.path.db.bonus);
            _app.logger.log(`_bonusObject: ${JSON.stringify(_bonusObject, null, 2)}`, "debug");
            let _rewardList = [];

            // select items from object where id = _msg.from.id
            for (const key in _bonusObject) {
                if (_bonusObject.hasOwnProperty(key)) {
                    const _item = _bonusObject[key];
                    if (_item.id_to == _msg.from.id) {
                        _rewardList.push(_item);
                        _app.logger.log(`Found bonus for user: ${_item.id} in _bonusObject`, "debug");
                    }
                }
            }

            if(_rewardList[0]) {
                _app.logger.log(`_rewardList: ${_rewardList}`, "debug");
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