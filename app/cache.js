
class CACHE {
    constructor(_app) {
        this.app = _app;
        this.cache = {};
    }

    async get(path) {
        this.app.logger.log(`Getting ${path} from cache}`, "debug");
        let _data = this.cache[path];
        if (_data === undefined) {
            this.app.logger.log(`Cache miss for ${path}`, "debug");
            _data = await this.app.db.get(path);
            this.cache[path] = _data;
        }
        else {
            this.app.logger.log(`Cache hit for ${path}`, "debug");
        }
        return this.cache[path];
    }

    async delete(_path) {
        if (this.cache[_path]) delete this.cache[_path];
        this.app.logger.log(`Removed ${_path} from cache`, "debug");
        return true;
    }

    async set(_path, _data) {
        this.cache[_path] = _data;
        this.app.logger.log(`Put ${_path} in cache`, "debug");
        return true;
    }
}
module.exports = CACHE