class Reward {
	async collectible(_app, _id, _rarity) {
		let _collectible = _app.COLLECTIBLES.find(collectible => collectible.id == _id && collectible.rarity == _rarity);
		if (_collectible) { 
			_app.logger.log(JSON.stringify(_collectible), "debug"); 
			return _collectible || false; 
		}
		else { 
			_app.logger.log(`Collectible with id ${_id} and rarity ${_rarity} not found`, "error"); 
			return false;
		}		
	}

	async rewardAdd(_app, _userID, _reward) {
		try {
			const _user = await _app.CACHE.get(_app.SETTINGS.path.db.users + _userID);
			const collectible = await this.collectible(_app, _reward.id, _reward.rarity);
			if (!collectible) {
				_app.logger.log(`Collectible with id ${_reward.id} not found`, "error");			
				return false;
			}

			const _record = {
				username: _user.username,
				usernickname: `${_user.first_name || ''} ${_user.last_name || ''}`.trim(),
				userid: _userID,
				id: collectible.id,
				name: collectible.name,
				rarity: _reward.rarity,
				time: new Date().toISOString(),
				from: "1337.plus",
			};

			let _message = _app.HELPER.reward_record_style(_record, _app.SETTINGS.rarity[_record.rarity].text);
			
			await this.writeDB(_app, _record, _message);
			
			return _record;

		} catch (error) {
			_app.logger.log(`Error in rewardAdd: ${error.stack}`, "error");
			return false;
		}
	}

	async writeDB(_app, _record, message) {
		try {
			await this.writeDB_daily(_app, _record);
			await _app.db.push(_app.SETTINGS.path.db.users + _record.userid + _app.SETTINGS.path.db.user.collectible, _record);
		
			_app.logger.log(`Records of reward added: ${message}`, "debug");
			return true;
		} catch (error) {
			_app.logger.log(`Error in writeDB: ${error.stack}`, "error");
			return false;
		}
	}

	async writeDB_daily(_app, record) {
		try {
			// push reward record to database
			await _app.db.set(_app.SETTINGS.path.db.stats.lastReward, record);
			await _app.db.push(_app.SETTINGS.path.db.stats.dailyrewards, record);
			await this.daily_rewards_update(_app);
			
		} catch (error) {
			_app.logger.log(`Error in writeDB_daily: ${error.stack}`, "error");
			return false;
		}
	}

	async daily_rewards_update(_app) {
		try {
			let _list = await _app.db.get(_app.SETTINGS.path.db.stats.dailyrewards);
			_app.logger.log(`Records of daily rewards from db: ${Object.keys(_list).length}`, "debug");

			// prepare new list without yesterday or older records
			let _newList = {};

			for (const key in _list) {
				if (_list.hasOwnProperty(key)) {
					const _item = _list[key];
					if (_app.HELPER.is_today(new Date(_item.time))) {
						_newList[key] = _item;
					} else {
						await _app.db.delete(_app.SETTINGS.path.db.stats.dailyrewards + key); // clean up old records in db
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

			_app.logger.log (`Records of daily reward cleaned up in db: ${Object.keys(_newList).length}`, "debug");
			return true;
		} catch (error) {
			_app.logger.log(`Error in daily_rewards_update: ${error.stack}`, "error");
			return false;
		}
	}

	async randomReward(_app, _rarity) {
		try {
			let _rewardList = _app.COLLECTIBLES.filter(collectible => collectible.rarity == _rarity);
			if (_rewardList.length > 0) {
				let _result = _rewardList[Math.floor(Math.random() * _rewardList.length)];
				_app.logger.log(`Random reward: ${JSON.stringify(_result, null, 2)}`, "debug");
				return _result;
			} else {
				_app.logger.log(`No rewards found with rarity ${_rarity}`, "error");
				return null;
			}
		} catch (error) {
			_app.logger.log(`Error in randomReward: ${error.stack}`, "error");
		}
	}

	async randomRarity(_app) {
		try {
			let _rarityList = Object.keys(_app.SETTINGS.rarity);
			let _totalWeight = _rarityList.reduce((total, rarity) => total + _app.SETTINGS.rarity[rarity].weight, 0);
			let _randomNum = Math.random() * _totalWeight;
			let _weightSum = 0;

			for (const rarity of _rarityList) {
				_weightSum += _app.SETTINGS.rarity[rarity].weight;
				if (_randomNum <= _weightSum) {
					_app.logger.log(`Random rarity: ${rarity}`, "debug");
					return rarity;
				}
			}
		} catch (error) {
			_app.logger.log(`Error in randomRarity: ${error.stack}`, "error");
			return undefined;
		}
	}
}

module.exports = Reward;