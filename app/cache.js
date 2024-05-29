let app;
class CACHE {
    constructor(_app) {
        app = _app;
    }

    cache = {};

    async get(_id) {
        if (!this.cache[_id]) {
            this.cache[_id] = await this.app.db.db_ref(_id).once('value');
        }
        return this.cache[_id];
    }

}
module.exports = CACHE