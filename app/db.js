import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import lodash from 'lodash';

// dirname
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// DB class
class DB {
  constructor(settings) {
    this.db = new LowSync(new JSONFileSync(join(__dirname, settings.path.db)), settings.defaultLowDBStructure);
    this.db.read();
    this.db.write();
  }

  async read() {
    await this.db.read();
    // If data doesn't exist, populate with default
    this.db.data ||= settings.defaultLowDBStructure;
  }

  async connect() {
    await this.db.read();
    await this.db.write();
  }

  async initialize(settings) {
    await this.db.read();
    // If data doesn't exist, initialize it with default structure
    if (!this.db.data) {
      this.db.data = settings.defaultLowDBStructure;
      await this.db.write();
    }
  }

  findUserById(id) {
    return lodash.chain(this.db.data).get('users').find({ id }).value();
  }
}

export default DB;
