import { readFile, writeFile } from 'fs/promises';
import Logger from './app/logger.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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
      const currentFilePath = fileURLToPath(import.meta.url);
      const currentDirPath = dirname(currentFilePath);
      const resolvedPath = resolve(currentDirPath, filePath);
      const data = await readFile(resolvedPath, 'utf8');
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
      await writeFile(this.filePath, data, 'utf8');
      console.log("Settings saved successfully");
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }
}

export default Loader;


