import { Injectable } from '@angular/core';
import { API, DataStore, Storage } from 'aws-amplify';
import { Recording } from 'src/models';
import { Promotion } from '../promotion-service/promotion.service';
import { Periods } from '../upload-service/upload.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  async getReferrer(referrer: string): Promise<string[]> {
    const key: string = `data/referrers/${referrer}.json`;

    try {
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status == 404) {
        return [];
      }
      const result = await response.json();
      return result.emails;
    } catch (err) {
      console.error('Error while getting referrer: ' + err);
      return [];
    }
  }

  async getPromos(): Promise<Promotion[]> {
    let returnList: Promotion[] = [];
    const key: string = `data/promotions.json`;

    try {
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status == 404) {
        return [];
      }
      const result = await response.json();
      for (let promo of result.promotions) {
        returnList.push(new Promotion(
          promo.code,
          promo.type,
          promo.freePeriods,
          promo.referrer ?? '',
          promo.referGroup ?? ''
        ));
      }
      return returnList;
    } catch (err) {
      console.error('Error while getting referrer: ' + err);
      return [];
    }
  }

  async createReferrer(referrer: string) {
    const key: string = `data/referrers/${referrer}.json`;
    const defaultReferrer = {
      referrer: referrer,
      purchases: 0,
      periods: 0,
      emails: []
    }

    try {
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status == 404) {
        await Storage.put(key, defaultReferrer);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error while creating referrer: ' + err);
      return false;
    }
  }

  async removeReferrer(referrer: string) {
    const key: string = `data/referrers/${referrer}.json`;
    
    try {
      await Storage.remove(key);
      return true;
    } catch (err) {
      console.error('Error while removing referrer: ' + err);
      return false;
    }
  }

  async updateReferrerPurchases(referrer: string, periods: Periods) {
    const key: string = `data/referrers/${referrer}.json`;

    try {
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status == 404) {
        return false;
      }
      const result = await response.json();
      let updatedFile = result;
      updatedFile.purchases = result.purchases + 1;
      updatedFile.periods = result.periods + periods.total;

      await Storage.put(key, updatedFile);

      return true;
    } catch (err) {
      console.error('Error while updating referrer: ' + err);
      return false;
    }
  }

  async removeUserFiles() {
    //Removing all recordings associated with the user
    try {
      const recordings = await DataStore.query(Recording);
      for (let recording of recordings) {
        try {
          const key = 'finishedJobs/' + recording.id + '.json';
          await Storage.remove(key);
        } catch (err) {
          console.error('Error while removing finished recording: ' + err);
        }
        await DataStore.delete(recording);
      }
    } catch (err) {
      console.error('Error when deleting datastore elements for user: ' + err);
    }
  
    //Removing all private files associated with the user
    try {
      const result = await Storage.list('', {level: 'private'});
  
      result.forEach(async (item) => {
        await Storage.remove(item.key!, {level: 'private'});
      })
    } catch (err) {
      console.error('Error while deleting all files: ' + err);
    }
  }
}
