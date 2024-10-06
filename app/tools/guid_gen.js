const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const inputData = JSON.parse(fs.readFileSync('input.json', 'utf8'));
const outputData = inputData.map(item => {
    if (!item.guid || item.guid === '') {
        item.guid = uuidv4();
    }
    return item;
});

fs.writeFileSync('output.json', JSON.stringify(outputData, null, 4));
