const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = class ExpressBackend {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.filePath = path.join(__dirname, '/storage', '/pp.json');
    }

    start() {
        this.app.get('/pp', (req, res) => {
            fs.readFile(this.filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                const jsonData = JSON.parse(data);
                res.json(jsonData);
            });
        });

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.listen(this.port, () => {
            console.log('\x1b[35m[Express Backend]\x1b[0m: Server is running on port:', this.port);
        });
    }
}