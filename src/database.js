const Database = require("better-sqlite3");

export class DB {
	constructor(databasePath) {
		this.db = new Database(databasePath);
	}

	read(query, params) {
		return this.db.prepare(query).get(params);
	}

	write(query, params) {
		const stmt = this.db.prepare(query);
		return stmt.run(params);
	}

	delete(query, params) {
		const stmt = this.db.prepare(query);
		return stmt.run(params);
	}

	close() {
		this.db.close();
	}
}