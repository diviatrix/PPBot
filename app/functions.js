module.exports = class FUNCTIONS {
    async is_admin(_app, _msg) {
        _app.logger.log(`Checking if ${_msg.from.id} is admin`, "info");
        let admin = await _app.db.get(_app.SETTINGS.path.db.users + _msg.from.id + _app.SETTINGS.path.db.user.admin);
        if (admin == true) {
            _app.logger.log(`${_msg.from.id} is admin`, "info");
            return true;
        } else {
            _app.logger.log(`${_msg.from.id} is not admin`, "info");
            return false;
        }
    }

    async messages_add (_app, _userid, _amount) { return await _app.db.increment(_app.SETTINGS.path.db.users + _userid + _app.SETTINGS.path.db.user.messages, _amount); }

    async exp_add (_app, _userid, _amount) { return _app.db.increment(_app.SETTINGS.path.db.users + _userid + _app.SETTINGS.path.db.user.experience, _amount); }

    async level_add (_app, _userid, _amount) { return await _app.db.increment(_app.SETTINGS.path.db.users + _userid + _app.SETTINGS.path.db.user.level, _amount); }

    async ticket_add (_app, _userid, _amount) { return await _app.db.increment(_app.SETTINGS.path.db.users + _userid + _app.SETTINGS.path.db.user.ticket, _amount); }
}