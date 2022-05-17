import { Injectable } from '@angular/core';
import { Storage } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  async getUserData(email: string) {
    const fileKey: string = 'userData/userData.json';
    let userDataNotFetched: boolean = true;

    while(userDataNotFetched) {
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
        userDataNotFetched = false;
        return result;
      } catch (err) {
        console.log('Error downloading file with key: ' + fileKey + ', error: ' + err);
        if (err == 'Error: Error! status: 404') {
          await this.createUserData(email, 0);
        } else {
          userDataNotFetched = false;
          return 'null';
        }
      }
    }
  }

  async createUserData(email: string, freePeriods: number) {
    const fileKey: string = 'userData/userData.json';
    const userData = {
      "email": email,
      "freePeriods": freePeriods
    }
    const res = await Storage.put(fileKey, userData, {level: 'private'});
  }
}
