const express = require('express');
const fs = require('fs').promises;
const Logger = require('./logger.js');
const path = require('path');

class WebBackend {
    constructor(_settings) {
        this.expressApp = express();
        this.settings = _settings;
        this.port = process.env.port || _settings.port || 3000;
        this.pp = null;
        this.logger = new Logger();
        this.server = null;
        this.loadPPAsync();
        this.start();
    }

    async loadPPAsync() {
        const ppPath = this.settings.path.PP;
        try {
            const ppData = await fs.readFile(path.join(__dirname, ppPath), 'utf8');
            this.pp = JSON.parse(ppData);
        } catch (err) {
            console.error(err);
        }
    }

    start() {
        this.expressApp.get('/pp', (req, res) => {
            if (this.pp) {
                res.json(this.pp);
            } else {
                res.status(500).send('Internal Server Error: cant load PP');
            }
        });

        this.expressApp.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        this.expressApp.use(express.static(path.join(__dirname, 'public')));

        this.server = this.expressApp.listen(this.port, () => { this.logger.log(`Web backend is running on port: ${this.port}`, "info" ); });
    }

    stop() {
        this.server.close();
    }
}

module.exports = WebBackend;
