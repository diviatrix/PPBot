const fs = require('fs');

function convertJSONtoCSV(jsonArray) {
    const csvRows = [];
    const headers = Object.keys(jsonArray[0]);
    csvRows.push(headers.join(','));

    for (const row of jsonArray) {
        const values = headers.map(header => {
            const escaped = (''+row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

// Read the json file
fs.readFile('input.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }
    const jsonArray = JSON.parse(data);
    const csvData = convertJSONtoCSV(jsonArray);

    // Write the csv data to a file
    fs.writeFile('export.csv', csvData, (err) => {
        if (err) {
            console.error('Error writing the file:', err);
        } else {
            console.log('Successfully exported to export.csv');
        }
    });
});
