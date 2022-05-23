import { Injectable } from '@angular/core';
import { DataStore, Storage } from 'aws-amplify';
import { Recording } from 'src/models';
import { AuthService } from '../auth-service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  async removeUserFiles() {
    //Removing all recordings associated with the user
    try {
      const recordings = await DataStore.query(Recording);
      for (let recording of recordings) {
        try {
          const key = 'finishedJobs/' + recording.id + '.json';
          await Storage.remove(key);
        } catch (err) {
          console.log('Error while removing finished recording: ' + err);
        }
        await DataStore.delete(recording);
      }
    } catch (err) {
      console.log('Error when deleting datastore elements for user: ' + err);
    }
  
    //Removing all private files associated with the user
    try {
      const result = await Storage.list('', {level: 'private'});
  
      result.forEach(async (item) => {
        await Storage.remove(item.key!, {level: 'private'});
      })
    } catch (err) {
      console.log('Error while deleting all files: ' + err);
    }
  }
}
