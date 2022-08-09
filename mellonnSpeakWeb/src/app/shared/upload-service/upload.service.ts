import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { AuthService } from '../auth-service/auth.service';
import { API, DataStore, Storage } from 'aws-amplify';
import { Recording } from 'src/models';
import { Subject } from 'rxjs';
import { getLocaleCurrencyCode } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploadFile: File;

  product: any;
  price: any;
  hasProduct: boolean = false;

  private uploadProgress = new Subject<number[]>();
  uploadProgressCalled = this.uploadProgress.asObservable();

  private uploadDone = new Subject<boolean>();
  uploadDoneCalled = this.uploadDone.asObservable();

  constructor(
    private authService: AuthService,
    @Inject(LOCALE_ID) private locale: string,
  ) { }

  getPeriods(duration: number): Periods {
    const total = Math.ceil((duration / 60) / 15);
    const freePeriods = this.authService.freePeriods;
    let periods;
    let freeLeft;
    if (freePeriods < total) {
      periods = total - freePeriods;
      freeLeft = 0;
    } else {
      periods = 0;
      freeLeft = freePeriods - total;
    }
    return new Periods(total, periods, freeLeft);
  }

  async getCustomerId(): Promise<string> {
    const params = {
      body: {
        "email": this.authService.email,
      }
    };
    const response = await API.put('stripe', '/customer', params);
    return response;
  }

  async createIntent(customerId: string, currency: string, product: string, quantity: number): Promise<string> {
    const params = {
      body: {
        "customerId": customerId,
        "currency": currency,
        "product": product,
        "quantity": quantity,
        "name": `${this.authService.firstName} ${this.authService.lastName}`,
        "country": this.locale.split('-')[1]
      }
    }

    const response = await API.put('stripe', '/intent', params);
    return response;
  }

  async createSetupIntent(customerId: string) {
    const params = {
      body: {
        "customerId": customerId,
      }
    }

    const response = await API.put('stripe', '/setupIntent', params);
    return response;
  }

  async getCards(customerId: string) {
    const params = {
      body: {
        "customerId": customerId,
      }
    }

    const response = await API.put('stripe', '/getCards', params);
    return response.data;
  }

  async removeCard(cardId: string) {
    const params = {
      body: {
        "cardId": cardId,
      }
    }

    const response = await API.put('stripe', '/removeCard', params);
    return response;
  }

  async getProduct(locale: string) {
    const currency = getLocaleCurrencyCode(locale);
    const params = {
      body: {
        "group": this.authService.group,
        "currency": currency
      }
    }

    try {
      const response = await API.put('stripe', '/getProduct', params);

      this.product = response.product;
      this.price = response.price;
      this.hasProduct = true;
      return this.hasProduct;
    } catch (err) {
      console.log(`Error while getting product: ${err}`);
      this.hasProduct = false;
      return this.hasProduct;
    }
  }

  async uploadRecording(file: File, title: string, desc: string, speakerCount: number, languageCode: string, periods: Periods) {
    const recording = new Recording({
      name: title,
      description: desc,
      date: new Date().toISOString(),
      fileName: file.name,
      fileKey: '',
      speakerCount: speakerCount,
      languageCode: languageCode
    });

    const fileType = file.name.split('.')[file.name.split('.').length - 1];
    const key = 'recordings/' + recording.id + '.' + fileType;
    
    const newRecording = Recording.copyOf(recording, copy => {
      copy.fileKey = key
    });
    
    try {
      const datastoreResult = await DataStore.save(newRecording);
      const storageResult = await Storage.put(key, file,
        {
          level: 'private',
          progressCallback: (progress) => {
            this.uploadProgress.next([progress.loaded, progress.total]);
          },
        }
      );
      await this.authService.updateFreePeriods(periods.freeLeft);
    } catch (err) {
      console.log('Error while uploading recording: ' + err);
    }
  }

  returnToRecordings() {
    this.uploadDone.next(true);
  }
}

export class Periods {
  total: number;
  periods: number;
  freeLeft: number;

  constructor(total: number, periods: number, freeLeft: number) {
    this.total = total;
    this.periods = periods;
    this.freeLeft = freeLeft;
  }
}