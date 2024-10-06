const express = require('express');
const path = require('path');
let APP;

class WebBackend {
    constructor(_app) {
        APP = _app;
        this.expressApp = express();
        this.port = process.env.port || APP.SETTINGS.port || 3000;
        this.server = null;
        this.start();
        APP.LOGGER.log('WebBackend constructed', "info");
    }

    start() {
        this.expressApp.get('/pp.json', (req, res) => {
            if (APP.COLLECTIBLES) {
                res.json(APP.COLLECTIBLES);
            } else {
                res.status(500).send('Internal Server Error: cant load PP');
            }
        });

        this.expressApp.get('/', (req, res) => {
            if (req.path === '/') {
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
            } else {
                res.sendFile(path.join(__dirname, 'public', req.path));
            }
        });

        this.expressApp.use(express.static(path.join(__dirname, 'public')));

        this.server = this.expressApp.listen(this.port, () => {
            APP.LOGGER.log("Web backend is running on port: " + this.port, "info");
        });
    }

    stop() {
        this.server.close();
    }
}

module.exports = WebBackend;

