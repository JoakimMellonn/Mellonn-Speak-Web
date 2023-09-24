import { Injectable } from '@angular/core';
import { DataStore, Auth } from 'aws-amplify';
import { Subject } from 'rxjs';
import { Promotion, PromotionType, Purchase, Referrer } from 'src/models';
import { AuthService } from '../auth-service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PromotionDbService {

  private switchCurrentMode = new Subject<'default' | 'upload' | 'admin'>();
  switchCurrentModeCalled = this.switchCurrentMode.asObservable();

  constructor(
    private authService: AuthService,
  ) { }

  changeCurrentMode(mode: 'default' | 'upload' | 'admin') {
    this.switchCurrentMode.next(mode);
  }

  async getPromotion(code: string, freePeriods: number, redeem?: boolean): Promise<Promotion | string> {
    if (redeem == undefined) redeem = true;

    try {
      if (await this.isCodeUsed(code)) return "used";
      const promotions = await DataStore.query(Promotion, (p) => p.code.eq(code));
      if (promotions.length == 0) return "no exist";
      const promotion = promotions[0];
      if (redeem) this.applyPromotion(promotion, freePeriods);
      return promotion;
    } catch (err) {
      console.error(err);
      return `${err}`;
    }
  }

  async isCodeUsed(code: string): Promise<boolean> {
    const { attributes } = await Auth.currentAuthenticatedUser();
    const codes = attributes['custom:promos'];
    if (codes == null || codes == undefined) return false;
    return codes.split(';').includes(code);
  }

  async applyPromotion(promotion: Promotion, userFreePeriods: number) {
    const freePeriods = promotion.freePeriods ?? 0;

    if (promotion.type != PromotionType.DEV) {
      const user = await Auth.currentAuthenticatedUser();
      const { attributes } = await Auth.currentAuthenticatedUser()
      let userPromos = attributes['custom:promos'];
      let newPromoList: string[] = userPromos == undefined ? [] : userPromos.split(';');
      newPromoList.push(promotion.code);
      await Auth.updateUserAttributes(user, {
        'custom:promos': newPromoList.join(';')
      });
    }

    if (promotion.type === PromotionType.BENEFIT) {
      await this.updateUserGroup('benefit');
      if (freePeriods > 0) {
        await this.authService.updateFreePeriods(userFreePeriods + freePeriods);
      }
    } else if (promotion.type === PromotionType.DEV) {
      await this.updateUserGroup('dev');
    } else if (promotion.type === PromotionType.PERIODS) {
      await this.authService.updateFreePeriods(userFreePeriods + freePeriods);
    } else if (promotion.type === PromotionType.REFERRER || promotion.type === PromotionType.REFERGROUP) {
      const referrer = (await DataStore.query(Referrer, (r) => r.id.eq(promotion.referrerID ?? '')))[0];
      await this.addUserToReferrer(referrer);
      if (freePeriods > 0) {
        await this.authService.updateFreePeriods(userFreePeriods + freePeriods);
      }
    }

    if (promotion.uses != 0) {
      if (promotion.uses == 1) {
        await DataStore.delete(promotion);
      } else {
        const newPromotion = Promotion.copyOf(promotion, copy => {
          copy.uses -= 1
        });
        await DataStore.save(newPromotion);
      }
    }
  }

  async updateUserGroup(group: 'dev' | 'benefit') {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:group': group
      });
      await this.authService.registerSignIn();
    } catch (err) {
      console.error(`Failed while updating user group: ${err}`);
    }
  }

  async addPromotion(type: PromotionType, code: string, uses: number, freePeriods: number, referrer: string): Promise<boolean> {
    try {
      const dbPromo = await DataStore.query(Promotion, (p) => p.code.eq(code));
      if (dbPromo.length > 0) return false;

      let promoReferrer: Referrer | null = null;
      let promotion: Promotion;
      const date: string = new Date().toISOString().split('T')[0];

      if (type === PromotionType.REFERRER || type === PromotionType.REFERGROUP) {
        promoReferrer = await this.createReferrer(referrer, type === PromotionType.REFERGROUP);
        if (promoReferrer == null || promoReferrer == undefined) throw 'Something went wrong creating the referrer';
        promotion = new Promotion({
          type: type,
          code: code,
          date: date,
          uses: uses,
          freePeriods: freePeriods,
          referrerID: promoReferrer.id
        });
      } else {
        promotion = new Promotion({
          type: type,
          code: code,
          date: date,
          uses: uses,
          freePeriods: freePeriods,
        });
      }
      await DataStore.save(promotion);
      return true;
    } catch (err) {
      console.error(`An error happened while adding the promo: ${err}`);
      return false;
    }
  }

  async removePromotion(code: string): Promise<boolean> {
    try {
      const promotion = await DataStore.query(Promotion, (p) => p.code.eq(code));
      if (promotion.length == 0) return true;
      await DataStore.delete(promotion[0]);
      return true;
    } catch (err) {
      console.error(`An error happened while removing the promo: ${err}`)
      return false;
    }
  }

  async addUserToReferrer(referrer: Referrer): Promise<boolean> {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:referrer': referrer.name,
        'custom:referGroup': referrer.isGroup ? referrer.name : ''
      });
      
      await DataStore.save(
        Referrer.copyOf(referrer, updated => {
          updated.members = referrer.members + 1
        })
      );
      return true;
    } catch (err) {
      console.error(`An error happened while adding user to referrer: ${err}`)
      return false;
    }
  }

  async createReferrer(referrer: string, isGroup: boolean): Promise<Referrer | null> {
    try {
      const dbReferrer = await DataStore.query(Referrer, (r) => r.name.eq(referrer));
      if (dbReferrer.length > 0) {
        if (dbReferrer[0].isGroup != isGroup) return null;
        return dbReferrer[0];
      }
      const referrerObj = new Referrer({
        name: referrer,
        members: 0,
        purchases: 0,
        seconds: 0,
        discount: 40,
        isGroup: isGroup
      });
      await DataStore.save(referrerObj);
      return referrerObj
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getReferrer(referrer: string): Promise<Referrer | null> {
    try {
      const dbReferrer = await DataStore.query(Referrer, (r) => r.name.eq(referrer));
      if (dbReferrer.length > 0) {
        return dbReferrer[0];
      }
      return null;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  async registerPurchase(duration: number) {
    try {
      let purchase = new Purchase({
        date: new Date().toISOString(),
        seconds: duration
      });
      const { attributes } = await Auth.currentAuthenticatedUser();
      const referrerCode = attributes['custom:referrer'];
      if (referrerCode != null && referrerCode != undefined) {
        const dbReferrer = await DataStore.query(Referrer, (r) => r.name.eq(referrerCode));
        if (dbReferrer.length != 0) {
          const referrer = dbReferrer[0];

          const updatedReferrer = Referrer.copyOf(referrer, updated => {
            updated.purchases = referrer.purchases + 1,
            updated.seconds = referrer.seconds + duration
          });
          await DataStore.save(updatedReferrer);
          purchase = new Purchase({
            date: new Date().toISOString(),
            seconds: duration,
            referrerID: referrer == null ? null : referrer.id
          });
        }
      }
      await DataStore.save(purchase);
    } catch (err) {
      console.log(`Error when registering purchase: ${err}`);
    }
  }

  discountString(promotion: Promotion): string {
    if (promotion.type == PromotionType.BENEFIT && promotion.freePeriods > 0) {
      return 'Benefit user (-40% on all purchases) and ' + promotion.freePeriods + ' free credit(s)';
    } else if (promotion.type == PromotionType.BENEFIT && promotion.freePeriods == 0) {
      return 'Benefit user (-40% on all purchases)';
    } else if (promotion.type == PromotionType.DEV) {
      return 'Developer user (everything is free)';
    } else {
      return promotion.freePeriods + ' free credits';
    }
  }

  getPromoType(type: string): PromotionType {
    switch (type) {
      case 'benefit': return PromotionType.BENEFIT
      case 'periods': return PromotionType.PERIODS
      case 'referrer': return PromotionType.REFERRER
      case 'referGroup': return PromotionType.REFERGROUP
      case 'dev': return PromotionType.DEV
      default: return PromotionType.PERIODS
    }
  }
}
