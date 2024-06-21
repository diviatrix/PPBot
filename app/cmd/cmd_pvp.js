const { resourceLimits } = require('worker_threads');

module.exports = class C_PVP{
    
    async run(_msg, _app) {
        if (!await _app.db.exist(_app.SETTINGS.path.db.users + _msg.from.id)) 
        {
            _app.commands.msg_notRegistered(_msg);
            return true;
        }
        
        const _lastPVP = await _app.db.get(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.stats.lastPVP);
        if (_app.HELPER.is_today(new Date(_lastPVP))) {
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_pvp_fail, _msg.message_id);
            return true;
        }

        _app.logger.log("Starting cmd_pvp", "info");
        const _users = await _app.CACHE.get(_app.SETTINGS.path.db.users);
        _app.logger.log(`Registered Users count: ${Object.keys(_users).length}`, "debug");

        let _fighters_list = Object.keys(_users).filter(key => key !== _msg.from.id && _users[key].settings?.nopvp !== true);

        if (_fighters_list.length <= 1) {
            await this.no_opponents_message(_msg, _app);
            return true;
        }

        const _randomIndex = Math.floor(Math.random() * _fighters_list.length);
        const _opponentIndex = _fighters_list[_randomIndex];
        const _opponent = _users[_opponentIndex];

        if (_opponent == undefined) {
            _app.logger.log("Random opponent is undefined", "error");
            _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_pvp_fail, _msg.message_id);
            return true;
        }
                
        _app.logger.log(`Chose random opponent: ${_opponent.id}`, "debug");

        const _user_collectible = await this.random_collectible_from_user(_msg.from.id, _app);       
        let _user_power = await this.id_to_cp(_user_collectible.id, _app);

        _app.logger.log(`Chose user random collectible: ${_user_collectible.id} with power: ${_user_power}`, "debug");

        const _opponent_collectible = await this.random_collectible_from_user(_opponent.id, _app);
        let _opponent_power = await this.id_to_cp(_opponent_collectible.id, _app);
        
        _app.logger.log(`Chose opponent random collectible: ${_opponent_collectible.id} with power: ${_opponent_power}`, "debug");

        let _winnerid = _msg.from.id;        
        let _winnerUsername = _msg.from.username;
        let _loserUsername = _opponent.username;

        if (_user_power < _opponent_power) 
        {
            _winnerid = _opponent.id;
            _winnerUsername = _opponent.username;
            _loserUsername = _msg.from.username;
        }

        let _rarity = await _app.reward.randomRarity(_app);
        let _reward = await _app.reward.randomReward(_app, _rarity);

        await _app.reward.rewardAdd(_app, _winnerid, _reward);
        await _app.db.set(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.stats.lastPVP, await _app.db.time());

        let _message = _app.SETTINGS.locale.base.cmd_pvp;
        _message += `@${_opponent.username} \n\n${_msg.from.username} : ${await _app.HELPER.reward_record_style(_user_collectible)} \n`;
        _message += `Power ${_user_power}\n`;
        _message += `\n${_opponent.username} :${await _app.HELPER.reward_record_style(_opponent_collectible)} \n`;
        _message += `Power ${_opponent_power}\n\n`;
        _message += `Победил: ${_winnerUsername} \n${_winnerUsername} получает:${await _app.HELPER.reward_record_style(_reward)} \n`;
        _message += `${_loserUsername} получает: ничего`;

        await _app.bot.sendMessage(_msg.chat.id, _message, _msg.message_id);
        
        await _app.db.increment(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.user.pvp_count, 1);
        await _app.db.increment(_app.SETTINGS.path.db.users + _opponent.id + _app.SETTINGS.path.db.user.pvp_count, 1);
                
        return true;
    }fi

    async no_opponents_message(_msg, _app) {
        _app.logger.log("No opponents found", "info");
        _app.bot.sendMessage(_msg.chat.id, _app.SETTINGS.locale.base.cmd_pvp_fail, _msg.message_id);
        return true;
    }

    async text_id_to_md5(_text_id) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');
        hash.update(_text_id);
        const power = hash.digest('hex');
        return power;
    }

    async md5_to_number(_md5) {
        const _result = _md5.replace(/\D/g, "");
        return _result;
    }

    async number_to_cp(_number) {
        const _cp = Math.floor(Math.sqrt(_number/100000000000)) + 1;
        return _cp;
    }

    async id_to_cp(_id, _app) {
        let _result = 0;

        if(isNaN(Number(_id))){
            let _md5 = await this.text_id_to_md5(_id);
            let _number = await this.md5_to_number(_md5);
            let _cp = await this.number_to_cp(_number);
            _result = _cp;
            _app.logger.log(`ID is not number, calculated power is ${_cp}`, "warning");
        }

        else _result = Number(_id);
        
        return _result;
    }

    async random_collectible_from_user(_userid, _app){
        const _user_wallet = await _app.db.get(_app.SETTINGS.path.db.users + _userid + _app.SETTINGS.path.db.user.collectible);
        if (!_user_wallet) return false;
        const _collection_size = Object.keys(_user_wallet).length;
        _app.logger.log(`User ${_userid} wallet size: ${_collection_size}`, "debug");
        
        let _result = false;

        if (_collection_size == 1) {
            _app.logger.log("Only one value in user wallet", "debug");
            _result = _user_wallet[Object.keys(_user_wallet)[0]];
        }
        else if (_collection_size > 1) {
            const _randomIndex = Math.floor(Math.random() * _collection_size);
            const _randomKey = Object.keys(_user_wallet)[_randomIndex];
            _result = _user_wallet[_randomKey];
            _app.logger.log(`Chose random collectible number ${_randomIndex}: ${_result.id}`, "debug");
        }

        return _result;
    }
}
