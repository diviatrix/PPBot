const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class WebBackend {
    constructor(_settings, _logger) {
        this.expressApp = express();
        this.settings = _settings;
        this.port = process.env.port || _settings.port || 3000;
        this.pp = null;
        this.logger = _logger;
        this.server = null;
        this.loadPPAsync();
        this.start();
        this.logger.log('WebBackend constructed', "info");
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

        this.server = this.expressApp.listen(this.port, () => { this.logger.log(this.settings.locale.console.back_run_pass + this.port, "info" ); });
    }

    stop() {
        this.server.close();
    }
}

module.exports = WebBackend;
