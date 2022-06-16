import { Injectable } from '@angular/core';
import { DataStore } from 'aws-amplify';
import { Settings } from 'src/models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  defaultSettings: Settings = new Settings({
    themeMode: 'System',
    languageCode: 'en-US',
    jumpSeconds: 3
  });
  currentSettings: Settings;
  jumpSecs: number = 3;

  constructor() { }

  async getSettings(): Promise<Settings> {
    try {
      let downloadedSettings: Settings;
      let settings: Settings[] = await DataStore.query(Settings);
      if (settings.length == 0) {
        downloadedSettings = await this.getDefaultSettings();
        await this.saveSettings(downloadedSettings);
      } else {
        if (settings.length > 1) {
          for (let i = settings.length; i > 1; i--) {
            await DataStore.delete(settings[i - 1]);
          }
          settings = await DataStore.query(Settings);
        }
        downloadedSettings = settings[0];
      }
      this.currentSettings = downloadedSettings
      return downloadedSettings;
    } catch (err) {
      console.log('Error downloading Settings: ' + err);
      const returnSettings = await this.getDefaultSettings();
      this.currentSettings = returnSettings;
      return returnSettings;
    }
  }

  async saveSettings(saveData: Settings): Promise<boolean> {
    this.currentSettings = saveData;
    try {
      await DataStore.save(saveData);
      return true;
    } catch (err) {
      console.log('Error uploading settings: ' + err);
      return false;
    }
  }

  async getDefaultSettings(): Promise<Settings> {
    console.log('Get default settings...');
    try {
      const settings = await DataStore.query(Settings);
      if (settings.length != 0) {
        const returnSettings: Settings = Settings.copyOf(settings[0], updated => {
          updated.themeMode = this.defaultSettings.themeMode,
          updated.languageCode = this.defaultSettings.languageCode,
          updated.jumpSeconds = this.defaultSettings.jumpSeconds
        });

        return returnSettings;
      } else {
        return this.defaultSettings;
      }
    } catch (err) {
      console.log('Error downloading Settings: ' + err);
      return this.defaultSettings;
    }
  }
}
