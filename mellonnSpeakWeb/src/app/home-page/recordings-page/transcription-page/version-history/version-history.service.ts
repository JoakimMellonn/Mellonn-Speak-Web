import { Injectable } from '@angular/core';
import { DataStore, SortDirection, Storage } from 'aws-amplify';
import { Subject } from 'rxjs';
import { Version } from 'src/models';
import { Transcription } from '../transcription';

@Injectable({
  providedIn: 'root'
})
export class VersionHistoryService {

  private recoverTrans = new Subject<number>();
  recoverTransCalled = this.recoverTrans.asObservable();

  constructor() { }

  recoverTranscription() {
    this.recoverTrans.next(1);
  }

  async saveNewVersion(recordingID: string, editType: string): Promise<string> {
    const newVersion: Version = new Version({recordingID: recordingID, date: new Date().toISOString(), editType: editType});
  
    try {
      var result = await DataStore.save(newVersion);
      //print('New version saved successfully');
    } catch (e) {
      console.log('Failed updating version list: ' + e);
    }
  
    try {
      const versions = await DataStore.query(Version, version => version.recordingID("eq", recordingID), {
        sort: (s) => s.date(SortDirection.ASCENDING),
      });
  
      if (versions.length > 10) {
        const deleteVersion = await DataStore.query(Version, version => version.id("eq", versions[0].id));
        deleteVersion.forEach((vers) => {
          DataStore.delete(vers);
          this.removeOldVersion(recordingID, vers.id);
        });
      }
      return newVersion.id;
    } catch (e) {
      console.log('Error saving new version: ' + e);
    }
    return 'error';
  }

  async uploadVersion(recordingID: string, transcription: Transcription, editType: string) {
    const versionID: string = await this.saveNewVersion(recordingID, editType);
    const key = 'versions/' + recordingID + '/' + versionID + '.json';

    try {
      const result = await Storage.put(key, transcription, {level: 'private'});
      console.log('Upload result: ' + result);
    } catch (e) {
      console.log('UploadFile Error: ' + e);
    }
  }

  async removeOldVersion(recordingID: string, versionID: string) {
    const key = 'versions/' + recordingID + '/' + versionID + '.json';

    try {
      const result = await Storage.remove(key, {level: 'private'});
      return true;
    } catch (e) {
      console.log('Error while removing file: ' + e);
      return false;
    }
  }
}
