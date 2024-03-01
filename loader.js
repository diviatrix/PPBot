const fs = require('fs').promises;
const path = require('path');
const Logger = require('./app/logger.js');

class Loader {
  constructor(callback) {
    (async () => {
      this.logger = new Logger();
      const settings = await this.loadJSONFromPath('./app/storage/settings.json');
      this.settings = settings;      
      callback(); // Signal completion to the requester
    })();
  }

  async loadJSONFromPath(filePath) {
    try {
      const currentFilePath = __filename;
      const currentDirPath = path.dirname(currentFilePath);
      const resolvedPath = path.resolve(currentDirPath, filePath);
      const data = await fs.readFile(resolvedPath, 'utf8');
      this.logger.log("Settings loaded successfully", "info");
      return JSON.parse(data);
    } catch (error) {
      this.logger.log(error, "error");
      return null;
    }
  }

  async saveSettings() {
    try {
      const data = JSON.stringify(this.settings);
      await fs.writeFile(this.filePath, data, 'utf8');
      console.log("Settings saved successfully");
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }
}

module.exports = Loader;
