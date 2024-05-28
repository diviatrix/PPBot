class Reward {
	constructor (_app) {
		this.app = _app;
		this.logger = _app.logger;
		this.COLLECTIBLES = _app.COLLECTIBLES;
		this.logger.log('Collectible constructed', "info");
		this.start();
	}

	// Start the module
	async start() {
		this.logger.log('Reward started', "info");
	}

	async collectible(_id, _rarity) {
		let _collectible = this.COLLECTIBLES.find(collectible => collectible.id == _id && collectible.rarity == _rarity);
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
		// list all COLLECTIBLES for userid in database
		// return list
		let user = await this.app.db.db_user_get(_msg);
		if (!user || !user['collectible']) {
			return [];
		}
		return Object.keys(user['collectible']);
	}

	async rewardAdd(_msg, _reward, _sendMessage) {
		const collectible = await this.collectible(_reward.id, _reward.rarity);
		if (!collectible) {
			this.logger.log(`Collectible with id ${_reward.id} not found`, "error");
			return false;
		}

		const record = {
			username: _msg.from.username,
			userid: _msg.from.id,
			usernickname: `${_msg.from.first_name || ''} ${_msg.from.last_name || ''}`.trim(),
			id: collectible.id,
			name: collectible.name,
			rarity: _reward.rarity,
			time: await this.app.db.time(),
			from: "1337.plus",
		};

		let message = "\n" + this.app.HELPER.str_style(`[${record.id}][${record.rarity}][${record.name}]`, this.app.SETTINGS.rarity[record.rarity].text);
		if(_sendMessage) this.app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);

		
		await this.app.db.db_push(this.app.SETTINGS.path.db.stats.dailylist, record);
		await this.app.db.db_set(this.app.SETTINGS.path.db.stats.lastReward, record);
		await this.app.db.db_user_push(_msg, this.app.SETTINGS.path.db.user.collectible, record);		
				
		return {record, message};
	}
	async randomReward(_rarity) {
		try {
			let _rewardList = this.COLLECTIBLES.filter(collectible => collectible.rarity == _rarity);
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
			let _rarityList = Object.keys(this.app.SETTINGS.rarity);
			let _totalWeight = _rarityList.reduce((total, rarity) => total + this.app.SETTINGS.rarity[rarity].weight, 0);
			let _randomNum = Math.random() * _totalWeight;
			let _weightSum = 0;

			for (const rarity of _rarityList) {
				_weightSum += this.app.SETTINGS.rarity[rarity].weight;
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

	async rewardsAdd(_msg, _rewards, _sendMessage)
	{		
		for (const reward of _rewards) {
			const rewardObject = await this.collectible(reward.id, reward.rarity);
			this.logger.log(`Reward object: ${JSON.stringify(rewardObject, null, 2)}`, "debug");

			if (rewardObject) {	this.rewardAdd(_msg, reward, _sendMessage); } else {
				this.logger.log(`Can not add reward with id ${reward.id} and rarity ${reward.rarity}`, "error");
			}
		}
	}

}

module.exports = Reward;