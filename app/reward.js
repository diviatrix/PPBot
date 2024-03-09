class Reward {
	constructor (_app) {
		this.app = _app;
		this.logger = _app.logger;
		this.settings = _app.settings;
		this.collectibles = _app.collectibles;
		this.logger.log('Collectible constructed', "info");
		this.start();
	}

	// Start the module
	async start() {
		this.logger.log('Reward started', "info");
	}

	async collectible(_id, _rarity) {
		let _collectible = this.collectibles.find(collectible => collectible.id == _id && collectible.rarity == _rarity);
		if (_collectible) { 
			this.logger.log(JSON.stringify(_collectible), "debug"); 
			return _collectible; 
		}
		else { 
			this.logger.log(`Collectible with id ${_id} and rarity ${_rarity} not found`, "error"); 
		}
		return null;
	}

	async list(_msg)
	{
		// list all collectibles for userid in database
		// return list
		let user = await this.app.db.db_user_get(_msg);
		if (!user || !user['collectible']) {
			return [];
		}
		return Object.keys(user['collectible']);
	}

	async rewardAdd(_msg, _reward)
	{
		this.logger.log(JSON.stringify(_reward, null, 2), "debug");

		try {
			this.logger.log(_msg.from.id +" " + _msg.from.username + ": " + this.settings.locale.console.reward_add_check, "debug");
			let _collectible = await this.collectible(_reward.id, _reward.rarity);

			this.logger.log(`Collectible: ${JSON.stringify(_collectible, null, 2)}`, "debug");

			let rewardRecord = {};

			if (_collectible) {
				rewardRecord.id = _collectible.id;
				rewardRecord.name = _collectible.name;
				rewardRecord.rarity = _reward.rarity;
				rewardRecord.time = await this.app.db.time();
				rewardRecord.from = "1337.plus";
				this.logger.log(`Reward record: ${JSON.stringify(rewardRecord, null, 2)}`, "debug");
				if (await this.app.db.db_user_push(_msg, this.settings.path.db.user.collectible, rewardRecord))
				{
					this.app.tgBot.sendMessage(_msg.chat.id, this.settings.locale.base.ach_reward + " " + this.app.converter.str_style(`[${_collectible.id}][${_collectible.rarity}][${_collectible.name}]`, this.settings.rarity[_reward.rarity].text), _msg.message_id);
				}
			} else {
				this.logger.log(`Collectible with id ${_reward.id} not found`, "error");
				return false;
			}
		} catch (error) {
			this.logger.log(`Error in rewardAdd: ${error.stack}`, "error");
		}
	}

	async rewardsAdd(_msg, _rewards)
	{
		let message = ` ${this.settings.locale.base.ach_reward}`;
		for (const reward of _rewards) {
			const rewardObject = await this.collectible(reward.id, reward.rarity);
			this.logger.log(`Reward object: ${JSON.stringify(rewardObject, null, 2)}`, "debug");

			if (rewardObject) {
				if (await this.rewardAdd(_msg, reward)) {
					message += `\n[${reward.type}][ID: ${reward.rarity}][${this.app.converter.str_style(rewardObject.description, this.settings.rarity[reward.rarity].text)}]: ${reward.value}`;
					this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);
				}
			} else {
				this.logger.log(`Can not add reward with id ${reward.id} and rarity ${reward.rarity}`, "error");
			}
		}
	}

}

module.exports = Reward;