let app;

class Reward {
	constructor (_app) {
		app = _app;
		app.logger.log('Collectible constructed', "info");
		this.start();
	}

	// Start the module
	async start() {
		app.logger.log('Reward started', "info");
	}

	async collectible(_id, _rarity) {
		let _collectible = app.COLLECTIBLES.find(collectible => collectible.id == _id && collectible.rarity == _rarity);
		if (_collectible) { 
			app.logger.log(JSON.stringify(_collectible), "debug"); 
			return _collectible; 
		}
		else { 
			app.logger.log(`Collectible with id ${_id} and rarity ${_rarity} not found`, "error"); 
		}
		return null;
	}

	async list(_msg)
	{
		// list all COLLECTIBLES for userid in database
		// return list
		let user = await app.db.db_user_get(_msg);
		if (!user || !user['collectible']) {
			return [];
		}
		return Object.keys(user['collectible']);
	}

	async rewardAdd(_msg, _reward, _sendMessage) {
		try {
			const collectible = await this.collectible(_reward.id, _reward.rarity);
			if (!collectible) {
				app.logger.log(`Collectible with id ${_reward.id} not found`, "error");
				return false;
			}

			const record = {
				username: _msg.from.username,
				userid: _msg.from.id,
				usernickname: `${_msg.from.first_name || ''} ${_msg.from.last_name || ''}`.trim(),
				id: collectible.id,
				name: collectible.name,
				rarity: _reward.rarity,
				time: new Date().toISOString(),
				from: "1337.plus",
			};

			let message = app.HELPER.str_style(`[${record.id}][${record.rarity}][${record.name}]`, app.SETTINGS.rarity[record.rarity].text);
			if(_sendMessage) app.tgBot.sendMessage(_msg.chat.id, message, _msg.message_id);

			await this.writeDB(_msg, record, message);

			return {record, message};
		} catch (error) {
			app.logger.log(`Error in rewardAdd: ${error.stack}`, "error");
			return false;
		}
	}

	async writeDB(_msg, record, message) {
		try {
			await this.writeDB_daily(_msg, record);
			await app.db.db_user_push(_msg, app.SETTINGS.path.db.user.collectible, record);
		
			app.logger.log(`Records of reward added: ${message}`, "debug");
			return true;
		} catch (error) {
			app.logger.log(`Error in writeDB: ${error.stack}`, "error");
			return false;
		}
	}

	async writeDB_daily(_msg, record) {
		try {
			// push reward record to database
			await app.db.db_set(app.SETTINGS.path.db.stats.lastReward, record);
			await app.db.db_push(app.SETTINGS.path.db.stats.dailyrewards, record);
			await this.daily_rewards_update();
			
		} catch (error) {
			app.logger.log(`Error in writeDB_daily: ${error.stack}`, "error");
			return false;
		}
	}

	async daily_rewards_update() {
		try {
			// get list of daily rewards by app.SETTINGS.path.db.stats.dailyrewards
			let _list = await app.db.db_get(app.SETTINGS.path.db.stats.dailyrewards);
			app.logger.log(`Records of daily rewards from db: ${Object.keys(_list).length}`, "debug");

			// prepare new list without yesterday or older records
			let _newList = {};

			for (const key in _list) {
				if (_list.hasOwnProperty(key)) {
					const _item = _list[key];
					if (app.HELPER.is_today(new Date(_item.time))) {
						_newList[key] = _item;
					} else {
						await app.db.db_delete(app.SETTINGS.path.db.stats.dailyrewards + key); // clean up old records in db
					}
				}
			}

			// sort _newList object by item.id
			_newList = Object.keys(_newList).sort().reduce(
				(obj, key) => {
					obj[key] = _newList[key];
					return obj;
				},
				{}
			);

			app.logger.log (`Records of daily reward cleaned up in db: ${Object.keys(_newList).length}`, "debug");
			return true;
		} catch (error) {
			app.logger.log(`Error in daily_rewards_update: ${error.stack}`, "error");
			return false;
		}
	}

	async randomReward(_rarity) {
		try {
			let _rewardList = app.COLLECTIBLES.filter(collectible => collectible.rarity == _rarity);
			if (_rewardList.length > 0) {
				let _result = _rewardList[Math.floor(Math.random() * _rewardList.length)];
				app.logger.log(`Random reward: ${JSON.stringify(_result, null, 2)}`, "debug");
				return _result;
			} else {
				app.logger.log(`No rewards found with rarity ${_rarity}`, "error");
				return null;
			}
		} catch (error) {
			app.logger.log(`Error in randomReward: ${error.stack}`, "error");
		}
	}

	async randomRarity() {
		try {
			let _rarityList = Object.keys(app.SETTINGS.rarity);
			let _totalWeight = _rarityList.reduce((total, rarity) => total + app.SETTINGS.rarity[rarity].weight, 0);
			let _randomNum = Math.random() * _totalWeight;
			let _weightSum = 0;

			for (const rarity of _rarityList) {
				_weightSum += app.SETTINGS.rarity[rarity].weight;
				if (_randomNum <= _weightSum) {
					app.logger.log(`Random rarity: ${rarity}`, "debug");
					return rarity;
				}
			}
		} catch (error) {
			app.logger.log(`Error in randomRarity: ${error.stack}`, "error");
			return undefined;
		}
	}

	async rewardsAdd(_msg, _rewards, _sendMessage)
	{		
		for (const reward of _rewards) {
			const rewardObject = await this.collectible(reward.id, reward.rarity);
			app.logger.log(`Reward object: ${JSON.stringify(rewardObject, null, 2)}`, "debug");

			if (rewardObject) {	this.rewardAdd(_msg, reward, _sendMessage); } else {
				app.logger.log(`Can not add reward with id ${reward.id} and rarity ${reward.rarity}`, "error");
			}
		}
	}

}

module.exports = Reward;