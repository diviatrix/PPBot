// gets telegram name and last name by id
async function getChatMemberNameById(chatID, userID) {
	const chatMember = await bot.getChatMember(chatID, userID);
	return chatMember.user.first_name + " " + chatMember.user.last_name;
}

// function to pick random rarity from list by its weight
function randomRarity() {
	const totalWeight = Object.values(rarityData).reduce((acc, rarity) => acc + rarity.dropRate, 0);
	let random = Math.random() * totalWeight;
	for (const rarity in rarityData) {
		random -= rarityData[rarity].weight;
		if (random <= 0) { return rarity; }
	}
}