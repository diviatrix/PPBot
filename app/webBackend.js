const express = require('express');
const path = require('path');

class WebBackend {
    constructor(_app) {
        this.expressApp = express();
        this.settings = _app.settings;
        this.port = process.env.port || _app.settings.port || 3000;
        this.collectibles = _app.collectibles;
        this.logger = _app.logger;
        this.server = null;
        this.start();
        this.logger.log('WebBackend constructed', "info");
    }

    start() {
        this.expressApp.get('/pp', (req, res) => {
            if (this.collectibles) {
                res.json(this.collectibles);
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
