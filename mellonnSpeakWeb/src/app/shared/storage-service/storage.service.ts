import { Injectable } from '@angular/core';
import { Storage } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  async getUserData() {
    const fileKey: string = 'userData/userData.json';

    try {
      const url = await Storage.get(fileKey, {level: 'private'});

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.log('Error downloading file with key: ' + fileKey + ', error: ' + err);
      return 'null';
    }
  }
}
