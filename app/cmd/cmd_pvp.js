/**
 * Runs the PvP command for the user.
 *
 * @param {Object} _msg - The message object containing user information
 * @return {boolean} Indicates if the function ran successfully
*/
let APP;
module.exports = class C_PVP{
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("C_PVP constructed", "info");
    }
    async run(_msg) {

        APP.LOGGER.log("Starting cmd_pvp", "info");

        if (!await APP.FUNCTIONS.is_registered(_msg)) return false;
        if (!await APP.FUNCTIONS.canPVP(_msg.from.id)) return APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_pvp_fail, _msg.message_id);

        let [_user, _opponent] = await Promise.all([
            APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id),
            APP.FUNCTIONS.random_user(_msg)
        ]);

        if (!_opponent) return false;

        const [_user_collectible, _opponent_collectible] = await Promise.all([
            APP.FUNCTIONS.random_collectible_from_user(_user),
            APP.FUNCTIONS.random_collectible_from_user(_opponent)
        ]);

        const [_user_power, _opponent_power] = await Promise.all([
            APP.FUNCTIONS.powerByID(_user_collectible.id),
            APP.FUNCTIONS.powerByID(_opponent_collectible.id)
        ]);

        let _message = APP.SETTINGS.locale.base.cmd_pvp;
        _message += `@${_opponent.username} \n${_msg.from.username} : ${await APP.HELPER.reward_record_style(_user_collectible)} \n`;
        _message += `Power ${_user_power}\n`;
        _message += `\n${_opponent.username} :${await APP.HELPER.reward_record_style(_opponent_collectible)} \n`;
        _message += `Power ${_opponent_power}\n`;

        let _rarity = await APP.FUNCTIONS.random_rarity();
        let _reward = await APP.FUNCTIONS.random_reward(_rarity);
        
        // pvp
        if (_user_power < _opponent_power) {
            _message += `Победил: ${_opponent.username} \n${_opponent.username} получает:${await APP.HELPER.reward_record_style(_reward)} \n`;
            await APP.FUNCTIONS.reward_add(_opponent.id, _reward);
        }
        else if (_user_power > _opponent_power){
            _message += `Победил: ${_msg.from.username} \n${_msg.from.username} получает:${await APP.HELPER.reward_record_style(_reward)} \n`;
            await APP.FUNCTIONS.reward_add(_msg.from.id, _reward);
        }
        else if (_user_power == _opponent_power){
            _message += `Вы просто полобызались и драки не вышло! Попробуй ещё раз!`;
        }

        // finishing
        
        await APP.DB.increment(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.user.pvp_count, 1);
        await APP.DB.increment(APP.SETTINGS.path.db.users + _opponent.id + APP.SETTINGS.path.db.user.pvp_count, 1);
        await APP.DB.set(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.user.last_pvp, Date.now());

        await APP.BOT.sendMessage(_msg.chat.id, _message, _msg.message_id);
        return true;
    }

    async no_opponents_message(_msg) {
        try {
            APP.LOGGER.log("No opponents found", "info");
            await APP.BOT.sendMessage(_msg.chat.id, APP.SETTINGS.locale.base.cmd_pvp_fail, _msg.message_id);
            return true;
        } catch (err) {
            APP.LOGGER.log(`Error in no_opponents_message: ${err}`, "error");
            return false;
        }
    }
}
