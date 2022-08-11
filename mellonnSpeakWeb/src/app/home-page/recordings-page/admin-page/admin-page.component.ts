import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { Promotion, PromotionService } from 'src/app/shared/promotion-service/promotion.service';
import { StorageService } from 'src/app/shared/storage-service/storage.service';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit {
  currentMode: 'groupAdmin' | 'groupList' | 'addPromo' | 'promoList' = 'groupAdmin';
  defaultMode: 'groupAdmin' | 'groupList' | 'addPromo' | 'promoList';
  isLoading: boolean = false;

  promoType: string = 'benefit';
  promoCode: string;
  promoUses: number;
  promoPeriods: number;
  promoReferrer: string;
  promoReferGroup: string;
  promoSuccess: string = '';
  promoError: string = '';

  promoSearch: string;
  promoList: Promotion[] = [];

  groupEmail: string;
  groupSuccess: string = '';
  groupError: string = '';

  groupSearch: string;
  groupList: string[] = [];
  groupRemoveLoading: boolean = true;

  constructor(
    private promotionService: PromotionService,
    public authService: AuthService,
    public storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.defaultMode = this.getDefaultMode();
    this.changeMode(this.defaultMode);
  }

  changeMode(mode: 'groupAdmin' | 'groupList' | 'addPromo' | 'promoList') {
    this.currentMode = mode;
    if(mode == 'groupList') {
      this.getGroupList();
      this.promotionService.changeCurrentMode('admin');
    } else if (mode == 'promoList') {
      this.getPromoList();
      this.promotionService.changeCurrentMode('admin');
    } else {
      this.promotionService.changeCurrentMode('default');
    }
  }

  async getGroupList() {
    this.isLoading = true;
    this.groupList = await this.storageService.getReferrer(this.authService.referrer);
    this.isLoading = false;
  }

  async getPromoList() {
    this.isLoading = true;
    this.promoList = await this.storageService.getPromos();
    this.isLoading = false;
  }

  getDefaultMode(): 'addPromo' | 'groupAdmin' {
    if (this.authService.groupAdmin) return 'groupAdmin';
    return 'addPromo';
  }

  async addPromoCode() {
    this.promoSuccess = '';
    this.promoError = '';
    if (this.validatePromo()) {
      this.isLoading = true;
      const res = await this.promotionService.addPromotion(
        this.promoType,
        this.promoCode,
        this.promoUses.toString(),
        this.promoPeriods.toString(),
        this.promoReferrer,
        this.promoReferGroup
      );
      this.isLoading = false;
      if (res) {
        this.promoSuccess = `Promotion ${this.promoCode} was added!`;
      } else {
        this.promoError = 'Something went wrong while adding promo';
      }
    } else {
      this.promoError = "You haven't entered a valid promo info";
    }
  }

  async removePromoCode() {
    this.promoSuccess = '';
    this.promoError = '';
    if (this.validatePromo()) {
      this.isLoading = true;
      const res = await this.promotionService.removePromotion(this.promoCode);
      this.isLoading = false;
      if (res) {
        this.promoSuccess = `Promotion ${this.promoCode} was removed!`;
      } else {
        this.promoError = 'Something went wrong while removing promo';
      }
    } else {
      this.promoError = "You haven't entered a valid promo info";
    }
  }

  async addUserToGroup() {
    this.groupSuccess = '';
    this.groupError = '';
    if (this.validateEmail(this.groupEmail)) {
      this.isLoading = true;
      const res = await this.promotionService.addUserToReferrer(this.authService.referrer, this.groupEmail, this.authService.referGroup);
      this.isLoading = false;
      if (res) {
        this.groupSuccess = 'The user was successfully added';
      } else {
        this.groupSuccess = '';
        this.groupError = 'Something went wrong while adding the user';
      }
    } else {
      this.groupSuccess = '';
      this.groupError = 'The entered email is not valid';
    }
  }

  async removeUserFromGroup(email: string) {
    this.groupSuccess = '';
    this.groupError = '';
    if (this.validateEmail(email)) {
      this.isLoading = true;
      const res = await this.promotionService.removeUserFromReferrer(this.authService.referrer, email, this.authService.referGroup);
      this.isLoading = false;
      if (res) {
        this.groupSuccess = 'The user was successfully removed';
      } else {
        this.groupSuccess = '';
        this.groupError = 'Something went wrong while removing the user';
      }
    } else {
      this.groupSuccess = '';
      this.groupError = 'The entered email is not valid';
    }
  }

  async removeUserClick(email: string) {
    const res = await this.promotionService.removeUserFromReferrer(this.authService.referrer, email, this.authService.referGroup);

    let newList: string[] = [];
    for (let em of this.groupList) {
      if (em != email) {
        newList.push(em);
      }
    }
    this.groupList = newList;

    if (res) {
      alert('User removed from your group.');
    } else {
      alert('Something went wrong when removing user from your group.');
    }
  }

  async removePromoClick(code: string) {
    const res = await this.promotionService.removePromotion(code);

    let newList: Promotion[] = [];
    for (let promo of this.promoList) {
      if (promo.code != code) {
        newList.push(promo);
      }
    }
    this.promoList = newList;

    if (res) {
      alert('Promo has been removed.');
    } else {
      alert('Something went wrong when removing the promo.');
    }
  }

  validateEmail(email: string): boolean {
    const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return reg.test(email);
  }

  validatePromo(): boolean {
    if (this.promoCode == null || this.promoCode == undefined || this.promoCode.length == 0) return false;
    if (!(this.promoUses > 0)) this.promoUses = 0;
    if (!(this.promoPeriods > 0)) this.promoPeriods = 0;
    if (this.promoType == 'referrer' || this.promoType == 'referGroup') {
      if (this.promoReferrer == null || this.promoReferrer == undefined || this.promoReferrer.length == 0) return false;
      if (this.promoReferGroup == null || this.promoReferGroup == undefined || this.promoReferGroup.length == 0) return false;
    } else {
      this.promoReferrer = '';
      this.promoReferGroup = '';
    }
    return true;
  }
}
