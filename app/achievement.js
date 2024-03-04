const bus = require('./eventBus.js');
const achievements = require('./storage/achievements.json');

class Achievement {
	constructor (_settings, _db, _logger) {
		this.logger = _logger;
		this.db = _db;
		this.settings = _settings;
		this.bus = bus;
		this.achievements = achievements;
		this.logger.log('Achievement constructed', "info");
		this.start();
	}

	async start() {
		for (let key in this.settings.path.db.user) {
			if (Object.prototype.hasOwnProperty.call(this.settings.path.db.user, key)) {
				let event = this.settings.path.db.user[key];
				if (typeof this[`h_${key}`] === 'function') {
					this.bus.on(event, (msg, data) => { this[`h_${key}`](msg, data);});
					this.logger.log(`Handler h_${key} for event ${event} created`, "info");
				} else {
					this.logger.log(`Handler h_${key} not found for event ${event}`, "warning");
				}
			}
		}
	}

	async h_register(_msg, _data) {
		this.logger.log(this.settings.locale.console.ach_register_check + _msg.from.id + ":\n" + JSON.stringify(_data,null,2), "info");
	}	
}

module.exports = Achievement;

// ачивка "брат куда так гонишь" - 10 сообщений за минуту