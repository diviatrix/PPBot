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

	async rewardAdd(_msg, _reward) {
		const collectible = await this.collectible(_reward.id, _reward.rarity);
		if (!collectible) {
			this.logger.log(`Collectible with id ${_reward.id} not found`, "error");
			return false;
		}

		const rewardRecord = {
			id: collectible.id,
			name: collectible.name,
			rarity: _reward.rarity,
			time: await this.app.db.time(),
			from: "1337.plus",
		};

		if (await this.app.db.db_user_push(_msg, this.settings.path.db.user.collectible, rewardRecord)){
			this.logger.log(`Reward stored to user profile: ${JSON.stringify(rewardRecord, null, 2)}`, "info");
			return rewardRecord;
		}		
	}
	async randomReward(_rarity) {
		try {
			let _rewardList = this.collectibles.filter(collectible => collectible.rarity == _rarity);
			if (_rewardList.length > 0) {
				let _result = _rewardList[Math.floor(Math.random() * _rewardList.length)];
				this.logger.log(`Random reward: ${JSON.stringify(_result, null, 2)}`, "debug");
				return _result;
			} else {
				this.logger.log(`No rewards found with rarity ${_rarity}`, "error");
				return null;
			}
		} catch (error) {
			this.logger.log(`Error in randomReward: ${error.stack}`, "error");
		}
	}

	async randomRarity() {
		try {
			let _rarityList = Object.keys(this.settings.rarity);
			let _totalWeight = _rarityList.reduce((total, rarity) => total + this.settings.rarity[rarity].weight, 0);
			let _randomNum = Math.random() * _totalWeight;
			let _weightSum = 0;

			for (const rarity of _rarityList) {
				_weightSum += this.settings.rarity[rarity].weight;
				if (_randomNum <= _weightSum) {
					this.logger.log(`Random rarity: ${rarity}`, "debug");
					return rarity;
				}
			}
		} catch (error) {
			this.logger.log(`Error in randomRarity: ${error.stack}`, "error");
			return undefined;
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
					message += `\n[${reward.type}][ID: ${reward.rarity}][${this.app.Helper.str_style(rewardObject.description, this.settings.rarity[reward.rarity].text)}]: ${reward.value}`;
					this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);
				}
			} else {
				this.logger.log(`Can not add reward with id ${reward.id} and rarity ${reward.rarity}`, "error");
			}
		}
	}

}

module.exports = Reward;