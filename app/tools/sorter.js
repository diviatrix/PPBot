const fs = require('fs');
const _input = require('./input.json');

let _sortedList = [];
for (const _key in _input) {
    _sortedList.push(_input[_key]);
}
_sortedList.sort((a, b) => a.id.localeCompare(b.id));

let formattedOutput = '[\n';
for (let i = 0; i < _sortedList.length; i++) {
    const item = _sortedList[i];
    formattedOutput += `\t{"id":"${item.id}","rarity":"${item.rarity}","name":"${item.name}"}`;
    if (i < _sortedList.length - 1) {
        formattedOutput += ',';
    }
    formattedOutput += '\n';
}
formattedOutput += ']';

fs.writeFileSync('output.json', formattedOutput);
