
class CACHE {
    constructor(_app) {
        this.app = _app;
        this.cache = {};
    }

    async get(path) {
        this.app.logger.log(`Getting ${path} from cache}`, "debug");
        let data = this.cache[path];
        if (data === undefined) {
            this.app.logger.log(`Cache miss for ${path}`, "debug");
            data = await this.app.db.db_get(path);
            this.cache[path] = data;
        }
        else {
            this.app.logger.log(`Cache hit for ${path}`, "debug");
        }
        return this.cache[path];
    }

    async remove(path) {
        delete this.cache[path];
        this.app.logger.log(`Removed ${path} from cache`, "debug");
    }

    async update(path) {
        this.cache[path] = await this.app.db.db_get(path);
        this.app.logger.log(`Updated cache for ${path}`, "debug");
        return this.cache[path];
    }

    async put(path, data) {
        this.cache[path] = data;
        this.app.logger.log(`Put ${path} in cache`, "debug");
    }
}
module.exports = CACHE