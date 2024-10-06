let APP;
module.exports = class FUNCTIONS {
    constructor(_app) {
        APP = _app;
        APP.LOGGER.log("Functions constructed", "info");
    }
    async is_admin(_msg) {
        APP.LOGGER.log(`Checking if ${_msg.from.id} is admin`, "info");
        let admin = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id + APP.SETTINGS.path.db.user.admin);
        if (admin == true) {
            APP.LOGGER.log(`${_msg.from.id} is admin`, "info");
            return true;
        } else {
            APP.LOGGER.log(`${_msg.from.id} is not admin`, "info");
            return false;
        }
    }

    async user_lastRoll(user) {
		const lastRoll = user.stats?.roll?.last;
		const lastRollTime = lastRoll && lastRoll.time ? new Date(lastRoll.time) : new Date(1337, 0, 1);

		let _result = APP.HELPER.is_today(lastRollTime) ? lastRoll : null;
		APP.LOGGER.log("Checking if last /roll was today: " + APP.HELPER.is_today(lastRollTime), "info");

		return _result;
	}

    async powerByID(_id) {
        try {
            let _collectible = await this.collectibleByID(_id);
            if (_collectible?.power) { APP.LOGGER.log(`Power of collectible ${_collectible.id} found: ${_collectible.power}`, "debug"); return _collectible.power; }
            else if (!isNaN(parseInt(_id))) { APP.LOGGER.log(`Power of collectible ${_collectible.id} not found, using ID as its power`, "warning"); return parseInt(_id); }
            else APP.LOGGER.log(`Power of collectible ${_collectible.id} not found, and ID is not a number`, "warning"); return 1337;
        } catch (err) {
            APP.LOGGER.log(`Error in power calculation: ${err.stack}`, "error");
            return 1337;
        }
    }

    async powerByGUID(_guid) {
        try {
            let _collectible = await this.collectibleByGUID(_guid);
            if (_collectible?.power) { APP.LOGGER.log(`Power of collectible ${_collectible.id} found: ${_collectible.power}`, "info"); return _collectible.power; }
            else return 1337;
        } catch (err) {
            APP.LOGGER.log(`Error in power calculation: ${err}`, "error");
            return 1337;
        }
    }

    async power(_collectible){
        if (_collectible?.power) return _collectible.power;
        else if (!isNaN(parseInt(_collectible.id))) return parseInt(_collectible.id);
        else return 1337;
    }

    async canPVP(_userID){
        const _lastPVP = await APP.DB.get(APP.SETTINGS.path.db.users + _userID + APP.SETTINGS.path.db.user.last_pvp);
        if (_lastPVP) {
            const lastPVPDate = new Date(_lastPVP);
            const today = new Date();
            APP.LOGGER.log(`Last PVP: ${lastPVPDate} Today: ${today}`, "debug");
            if (lastPVPDate.getUTCFullYear() === today.getUTCFullYear() &&
                lastPVPDate.getUTCMonth() === today.getUTCMonth() &&
                lastPVPDate.getUTCDate() === today.getUTCDate()) {
                return false;
            } else {
                return true;
            }
        }
        return true;
    }
    async random_user(_msg) {
    try {
        let _users = await APP.DB.get(APP.SETTINGS.path.db.users);

        if (Object.keys(_users).length <= 0) {
            APP.LOGGER.log("No registered users", "error");
            return false;
        }

        if (Object.keys(_users).length == 1) {
            APP.LOGGER.log("Only one registered user", "debug");
            return false;
        }

        if (_msg?.from?.id) 
        {
            if (!this.is_registered(_msg)) return false;
            else delete _users[_msg.from.id];
        }

        APP.LOGGER.log(`Registered Users count: ${Object.keys(_users).length}`, "debug");
        
        let _randomIndex = Math.floor(Math.random() * Object.keys(_users).length);
        let _randomUser = _users[Object.keys(_users)[_randomIndex]];
        //APP.LOGGER.log(`Random User: ${JSON.stringify(_randomUser)}`, "debug");
        return _randomUser;

    } catch (error) {
        APP.LOGGER.log(`Error in randomPlayer: ${error.stack}`, "error");
        return false;
        }
    }

    async reward_add(_userID, _reward) {
		try {
			const _user = await APP.DB.get(APP.SETTINGS.path.db.users + _userID);
            let _collectible;

            if (_reward.guid != ""){
                _collectible = await this.collectibleByGUID( _reward.guid);
            } else if (_reward.id != "") {
                _collectible = await this.collectibleByID( _reward.id);
            } else {
                return false;
            }

			const _record = {
				username: _user.username,
				usernickname: `${_user.first_name || ''} ${_user.last_name || ''}`.trim(),
				userid: _userID,
				id: _collectible.id,
				name: _collectible.name,
				guid: _collectible.guid,
				rarity: _collectible.rarity,
				time: await APP.DB.time(),
				from: "1337.plus",
			};

			let _message = APP.HELPER.reward_record_style(_record);
			
			await APP.REWARD.writeDB(_record, _message);
			
			return _record;

		} catch (error) {
			APP.LOGGER.log(`Error in rewardAdd: ${error.stack}`, "error");
			return false;
		}
	}

    async random_reward(_rarity) {
		try {
			let _rewardList = APP.COLLECTIBLES.filter(collectible => collectible.rarity == _rarity);
			if (_rewardList.length > 0) {
				let _result = _rewardList[Math.floor(Math.random() * _rewardList.length)];
				APP.LOGGER.log(`Random reward: ${JSON.stringify(_result, null, 2)}`, "debug");
				return _result;
			} else {
				APP.LOGGER.log(`No rewards found with rarity ${_rarity}`, "error");
				return null;
			}
		} catch (error) {
			APP.LOGGER.log(`Error in randomReward: ${error.stack}`, "error");
		}
	}

    async random_rarity() {
		try {
			let _rarityList = Object.keys(APP.SETTINGS.rarity);
			let _totalWeight = _rarityList.reduce((total, rarity) => total + APP.SETTINGS.rarity[rarity].weight, 0);
			let _randomNum = Math.random() * _totalWeight;
			let _weightSum = 0;

			for (const rarity of _rarityList) {
				_weightSum += APP.SETTINGS.rarity[rarity].weight;
				if (_randomNum <= _weightSum) {
					APP.LOGGER.log(`Random rarity: ${rarity}`, "debug");
					return rarity;
				}
			}
		} catch (error) {
			APP.LOGGER.log(`Error in randomRarity: ${error.stack}`, "error");
			return false;
		}
	}

    async random_collectible_from_user(_user){
        try {
            const _user_wallet = await APP.DB.get(APP.SETTINGS.path.db.users + _user.id + APP.SETTINGS.path.db.user.collectible);
            if (!_user_wallet) return false;

            const _collection_size = Object.keys(_user_wallet).length;
            APP.LOGGER.log(`User ${_user.id} wallet size: ${_collection_size}`, "debug");
            
            let _result = false;

            if (_collection_size == 1) {
                APP.LOGGER.log("Only one value in user wallet", "debug");
                _result = _user_wallet[Object.keys(_user_wallet)[0]];
            }
            else if (_collection_size > 1) {
                const _randomIndex = Math.floor(Math.random() * _collection_size);
                const _randomKey = Object.keys(_user_wallet)[_randomIndex];
                _result = _user_wallet[_randomKey];
                APP.LOGGER.log(`Chose random collectible number ${_randomIndex}: ${_result.id}`, "debug");
            }

            return _result;
        } catch (err) {
            APP.LOGGER.log(`Error in random_collectible_from_user: ${err.stack}`, "error");
            return false;
        }
    }

    async is_registered(_msg) {
        let _user = await APP.DB.get(APP.SETTINGS.path.db.users + _msg.from.id);
        
        if (_user) return true;
        else return false;
    }

	async collectibleByGUID (_guid) {
		try {
			let _collectible = APP.COLLECTIBLES.find(collectible => collectible.guid == _guid);
			if (_collectible) { 
				APP.LOGGER.log(JSON.stringify(_collectible), "debug"); 
				return _collectible || false; 
			}
			else { 
				APP.LOGGER.log(`Collectible with guid ${_guid} not found`, "error"); 
				return false;
			}		
		} catch (error) {
			APP.LOGGER.log(`Error in collectible: ${error.stack}`, "error");
			return false;
		}
	}

    async collectibleByID (_id){
        try {
            let _collectible = APP.COLLECTIBLES.find(collectible => collectible.id == _id);
            if (_collectible) { 
                APP.LOGGER.log(JSON.stringify(_collectible), "debug"); 
                return _collectible || false; 
            }
            else { 
                APP.LOGGER.log(`Collectible with id ${_id} not found`, "error"); 
                return false;
            }
        } catch (error) {
            APP.LOGGER.log(`Error in collectible: ${error.stack}`, "error");
            return false;
        }
    }

    async messages_add (_userid, _amount) {
        APP.LOGGER.log(`Incrementing messages for user ${_userid} by ${_amount}`, "debug");
        return await APP.DB.increment(APP.SETTINGS.path.DB.users + _userid + APP.SETTINGS.path.DB.user.messages, _amount);
    }

    async exp_add (_userid, _amount) {
        APP.LOGGER.log(`Incrementing exp for user ${_userid} by ${_amount}`, "debug");
        return APP.DB.increment(APP.SETTINGS.path.DB.users + _userid + APP.SETTINGS.path.DB.user.experience, _amount);
    }

    async level_add (_userid, _amount) {
        APP.LOGGER.log(`Incrementing level for user ${_userid} by ${_amount}`, "debug");
        return await APP.DB.increment(APP.SETTINGS.path.DB.users + _userid + APP.SETTINGS.path.DB.user.level, _amount);
    }

    async ticket_add (_userid, _amount) {
        APP.LOGGER.log(`Incrementing ticket for user ${_userid} by ${_amount}`, "debug");
        return await APP.DB.increment(APP.SETTINGS.path.DB.users + _userid + APP.SETTINGS.path.DB.user.ticket, _amount);
    }

    async collection_add (_userid, guid) {
        APP.LOGGER.log(`Adding collection item [${guid}] for user ${_userid}`, "debug");
        return await this.rewardAdd(APP, _userid, { id: _id, rarity: _rarity });
    }
}