const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

class Database {
	constructor(filePath) {
		this.filePath = filePath;
		this.db = null;
		this.connect();
	}

	connect() {
		const adapter = new FileSync(this.filePath);
		this.db = low(adapter);
		// Add any necessary configurations or defaults here
		this.db.defaults({ users: [] }).write();
	}

	getDb() {
		if (!this.db) {
			throw new Error("Database not connected. Call connect() first.");
		}
		return this.db;
	}
}

module.exports = Database;
