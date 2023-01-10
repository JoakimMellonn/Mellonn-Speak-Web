import { Component, Input, OnInit } from '@angular/core';
import { loadStripe, Stripe, StripePaymentElement } from '@stripe/stripe-js';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { LanguageService } from 'src/app/shared/language-service/language.service';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { Periods, UploadService } from 'src/app/shared/upload-service/upload.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.component.html',
  styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent implements OnInit {
  @Input() file: File;

  player = new Audio();
  audioLoaded: boolean = false;
  duration: number;
  periods: Periods;
  buttonText: string = 'Continue to payment';

  title: string;
  description: string;
  speakerSelect: string = "2";
  languageSelect: string;
  errorMessage: string = '';

  //Tax stuff
  zipType: 'US' | 'CA' | 'none' = 'none';
  zipCode: string;

  unitPrice: number = 49;
  currency: string = 'dkk';

  stripe: Stripe | null;
  paymentElement: StripePaymentElement;
  cardsLoading: boolean = true;
  paymentActive: boolean = false;
  paymentProcessing: boolean = false;
  customerId: string;
  paymentLoading: boolean = true;
  paymentIntent: any;
  clientSecret: string;
  rememberCard: boolean = false;
  paymentError: string = '';

  /*cardElement: StripeCardElement;
  cardSelect: string;
  paymentMethods: any[];
  defaultMethod: any;
  otherMethod: boolean = false;
  otherCard: boolean = false;
  monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];*/

  uploadLoaded: number;
  uploadTotal: number;
  isUploading: boolean = false;

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.languageSelect = this.settingsService.currentSettings.languageCode;
    const fileUrl = URL.createObjectURL(this.file);
    this.player.src = fileUrl;
    this.uploadService.uploadFile = this.file;

    this.player.onloadedmetadata = () => {
      if (!this.audioLoaded) {
        this.duration = this.player.duration;
        if (this.duration > 9000) {
          alert('The chosen audio file is too long, max length for an audio file is 2.5 hours (150 minutes).');
          this.uploadService.returnToRecordings();
        }
        this.uploadService.initFfmpeg(); //Doesn't work in localhost
        this.periods = this.uploadService.getPeriods(this.duration);
        if (this.periods.periods == 0) this.buttonText = 'Upload recording';
        this.audioLoaded = true;
      }
    }

    if (this.authService.group == 'dev') this.buttonText = 'Upload recording';

    //Setting prices
    this.unitPrice = this.uploadService.price.unit_amount/100;
    this.currency = this.uploadService.currency;

    if (this.languageService.countryCode == 'US') {
      this.zipType = 'US';
    } else if (this.languageService.countryCode == 'CA') {
      this.zipType = 'CA';
    }

    this.uploadService.uploadProgressCalled.subscribe((progress) => {
      this.uploadLoaded = progress[0];
      this.uploadTotal = progress[1];
    });
    this.getCustomer();
    //this.getCards();
  }

  async getCustomer() {
    this.customerId = await this.uploadService.getCustomerId();
  }

  //Get card stuff
  /*
  async getCards() {
    this.cardsLoading = true;
    this.customerId = await this.uploadService.getCustomerId();
    this.paymentMethods = await this.uploadService.getCards(this.customerId);

    if (this.paymentMethods.length > 0) {
      if (this.settingsService.currentSettings.primaryCard) {
        if (this.containsCard(this.paymentMethods, this.settingsService.currentSettings.primaryCard)) {
          this.defaultMethod = this.getCardFromId(this.paymentMethods, this.settingsService.currentSettings.primaryCard);
        } else {
          this.defaultMethod = this.paymentMethods[0];
        }
      } else {
        this.defaultMethod = this.paymentMethods[0];
      }
      this.cardSelect = this.defaultMethod.id;
    }
    this.cardsLoading = false;
  }

  containsCard(methods: any[], primary: string): boolean {
    for (let method of methods) {
      if (method.id == primary) {
        return true;
      }
    }
    return false;
  }

  getCardFromId(methods: any[], id: string) {
    for (let method of methods) {
      if (method.id == id) {
        return method;
      }
    }
  }

  getCardIcon(brand: string) {
    if (brand == 'visa') {
      return 'fa-brands fa-cc-visa fa-lg';
    } else if (brand == 'mastercard') {
      return 'fa-brands fa-cc-mastercard fa-lg';
    } else {
      return 'fa-solid fa-credit-card fa-lg';
    }
  }

  capFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async onCardSelect(id?: string) {
    if (id != undefined) {
      this.cardSelect = id;
    }
  }
  */

  async setupPayment() {
    this.clientSecret = await this.uploadService.createIntent(
      this.customerId,
      this.currency,
      this.uploadService.product.id,
      this.periods.periods,
      this.zipType == 'none' ? null : this.zipCode.toUpperCase()
    );
    this.stripe = await loadStripe(environment.stripeKey,  {
      betas: ['process_order_beta_1'],
      apiVersion: "2022-08-01; orders_beta=v4"
    });
    const elements = this.stripe!.elements({clientSecret: this.clientSecret});
    //this.cardElement = elements.create('card');

    let options = {};
    if (this.zipType != 'none') {
      options = {
        defaultValues: {
          billingDetails: {
            address: {
              country: this.languageService.countryCode,
              postal_code: this.zipCode.toUpperCase()
            }
          }
        }
      }
    }
    this.paymentElement = elements.create('payment', options);

    const card = document.getElementById('cardElement');
    
    this.paymentLoading = false;
    this.paymentElement.mount(card!);
    
    /*if (this.paymentMethods.length == 0) {
      this.cardElement.mount(card!);
    }*/

    const form = document.getElementById('paymentForm');
    form!.addEventListener('submit', async (event) => {
      if (this.paymentProcessing) return;
      this.paymentElement.update({readOnly: true});
      this.paymentProcessing = true;

      /*let paymentMethod;
      if (this.otherCard || this.paymentMethods.length == 0) {
        paymentMethod = {card: this.cardElement};
        if (this.rememberCard) {
          const setupIntent = await this.uploadService.createSetupIntent(this.customerId);
          const result = await this.stripe!.confirmCardSetup(setupIntent, {
            payment_method: { card: this.cardElement },
          });
        }
      } else if (this.otherMethod) {
        paymentMethod = this.cardSelect;
      } else {
        paymentMethod = this.defaultMethod.id;
      }*/

      const result = await this.stripe!.processOrder({
        elements: elements,
        redirect: "if_required"
      });
      
      if (result.error) {
        console.error('Error while paying: ' + result.error.message);
        this.paymentElement.update({readOnly: false});
        this.paymentProcessing = false;
        this.paymentError = result.error.message!;
        this.paymentIntent = result.paymentIntent;
      } else {
        this.paymentIntent = result.paymentIntent;
        this.startUpload();
        this.paymentProcessing = false;
      }
    });
  }

  async continueClick() {
    if (this.periods.periods == 0 || this.authService.group == 'dev') {
      if (this.title == null || this.title!.length == 0 && this.description == null || this.description!.length == 0) {
        this.errorMessage = 'You need to fill in the title and description';
      } else if (this.title == null || this.title!.length == 0) {
        this.errorMessage = 'You need to fill in the title';
      } else if (this.description == null || this.description!.length == 0) {
        this.errorMessage = 'You need to fill in the description';
      } else {
        this.errorMessage = '';
        await this.startUpload();
      }
    } else {
      if (this.title == null || this.title!.length == 0 && this.description == null || this.description!.length == 0) {
        this.errorMessage = 'You need to fill in the title and description';
      } else if (this.title == null || this.title!.length == 0) {
        this.errorMessage = 'You need to fill in the title';
      } else if (this.description == null || this.description!.length == 0) {
        this.errorMessage = 'You need to fill in the description';
      } else if (this.zipType != 'none' && (this.zipCode == null || this.zipCode!.length == 0)) {
        this.errorMessage = 'You need to fill in the ZIP-code';
      } else if (!this.validateZip(this.zipCode)) {
        this.errorMessage = `You need to enter a valid ZIP-code`;
      } else {
        this.errorMessage = '';
        this.paymentActive = true;
        this.paymentLoading = true;
        await this.setupPayment();
      }
    }
  }

  validateZip(zipCode: string): boolean {
    const us = /^(\d{5}(-\d{4})?)$/;
    const ca = /^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z] [0-9][ABCEGHJ-NPRSTV-Z][0-9]$/;

    if (this.zipType == 'US') {
      return us.test(zipCode.toUpperCase());
    } else if (this.zipType == 'CA') {
      return ca.test(zipCode.toUpperCase());
    } else {
      return true;
    }
  }

  async startUpload() {
    this.isUploading = true;
    await this.uploadService.uploadRecording(this.file, this.title, this.description, +this.speakerSelect, this.languageSelect, this.periods);
    alert('Recording has been uploaded and will be transcribed! Estimated time for completion: ' + this.estimatedTime(this.periods.total) + '. \nThis is only an estimate, it can take up to 2 hours. If it takes longer, please report an issue on the profile page.');
    this.isUploading = false;
    this.uploadService.returnToRecordings();
  }

  estimatedTime(totalPeriods: number): string {
    let returnString: string = '';
    if (totalPeriods <= 4) {
      returnString = 'ca. 10-15 minutes';
    } else if (totalPeriods <= 8) {
      returnString = 'ca. 20-30 minutes';
    } else {
      returnString = 'ca. 35-45 minutes';
    }
    return returnString;
  }
}
