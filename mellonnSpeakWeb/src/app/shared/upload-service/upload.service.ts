import { Injectable } from '@angular/core';
import { AuthService } from '../auth-service/auth.service';
import { API, DataStore, Storage } from 'aws-amplify';
import { Recording } from 'src/models';
import { Subject } from 'rxjs';
import { LanguageService } from '../language-service/language.service';
import { PromotionDbService } from '../promotion-db-service/promotion-db.service';

const supportedExtensions = ['amr', 'flac', 'mp3', 'mp4', 'ogg', 'webm', 'wav'];

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploadFile: File;

  product: any;
  price: any;
  currency: any;
  hasProduct: boolean = false;

  private uploadText = new Subject<string>();
  uploadTextCalled = this.uploadText.asObservable();

  private uploadProgress = new Subject<number[]>();
  uploadProgressCalled = this.uploadProgress.asObservable();

  private uploadDone = new Subject<boolean>();
  uploadDoneCalled = this.uploadDone.asObservable();

  constructor(
    private authService: AuthService,
    private languageService: LanguageService,
    private promotionService: PromotionDbService,
  ) {}

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
    return new Periods(total, periods, freeLeft, duration);
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

  async createIntent(customerId: string, currency: string, product: string, quantity: number, postalCode: string | null): Promise<string> {
    const params = {
      body: {
        "customerId": customerId,
        "currency": currency,
        "product": product,
        "quantity": quantity,
        "country": this.languageService.countryCode,
        "postalCode": postalCode
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

  async getProduct() {
    const currency = this.languageService.currency;
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
      this.currency = response.currency;
      this.hasProduct = true;

      return this.hasProduct;
    } catch (err) {
      console.error(`Error while getting product: ${err}`);
      this.hasProduct = false;
      return this.hasProduct;
    }
  }

  async uploadRecording(file: File, title: string, desc: string, speakerCount: number, languageCode: string, periods: Periods) {
    console.log(`Title: ${title}, desc: ${desc}, fileName: ${file.name}, sc: ${speakerCount}, lc: ${languageCode}, date: ${new Date().toISOString()}`);
    const recording = new Recording({
      name: title,
      description: desc,
      date: new Date().toISOString(),
      fileName: file.name,
      fileKey: '',
      speakerCount: speakerCount,
      languageCode: languageCode
    });

    let uploadFile = file;
    let fileType = file.name.split('.')[file.name.split('.').length - 1];

    if (!supportedExtensions.includes(fileType.toLowerCase())) {
      uploadFile = await this.convertToWAV(file, recording.id);
      fileType = 'wav';
    }

    this.uploadText.next('Uploading recording...');
    const key = 'recordings/' + recording.id + '.' + fileType;

    const newRecording = Recording.copyOf(recording, copy => {
      copy.fileKey = key
    });

    try {
      console.log(newRecording);
      await DataStore.save(newRecording);
      console.log("Saved recording")
      await Storage.put(key, uploadFile,
        {
          level: 'private',
          progressCallback: (progress) => {
            this.uploadProgress.next([progress.loaded, progress.total]);
          },
        }
      );
      console.log("Uploaded recording")
      await this.authService.updateFreePeriods(periods.freeLeft);
      console.log("Updated free periods")
      await this.promotionService.registerPurchase(periods.duration);
      console.log("Registered purchase")
    } catch (err) {
      console.error('Error while uploading recording: ' + err);
    }
  }

  async convertToWAV(inputFile: File, id: string): Promise<File> {
    const inputString: string = `${id}.${inputFile.name.split('.')[inputFile.name.split('.').length - 1]}`;
    const outputString: string = `${id}.wav`;

    try {
      const inputKey: string = `convert/input/${inputString}`;
      await Storage.put(inputKey, inputFile, {
        level: 'public'
      });

      const params = {
        body: {
          "inputString": inputString,
          "outputString": outputString,
          "inputKey": inputKey
        }
      };

      const response = await API.put('convert', '/wav', params);
      console.log(response);

      const result = await Storage.get(`convert/output/${outputString}`, {
        level: 'public',
        download: true
      });

      if (!(result.Body instanceof Blob)) throw 'Result is not a Blob';

      const outputFile = new File([result.Body], `${inputFile.name.split('.')[0]}.wav`, { lastModified: inputFile.lastModified, type: 'audio/wav' });

      return outputFile;
    } catch (e) {
      console.error(e);
      return new File([Buffer.from(`${e}`, 'utf-8')], 'error.txt');
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
  duration: number;

  constructor(total: number, periods: number, freeLeft: number, duration: number) {
    this.total = total;
    this.periods = periods;
    this.freeLeft = freeLeft;
    this.duration = duration;
  }
}
