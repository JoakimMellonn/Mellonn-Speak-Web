import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'aws-amplify';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { Promotion, PromotionService } from 'src/app/shared/promotion-service/promotion.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  formP1: FormGroup;
  formP2: FormGroup;
  promoForm: FormGroup;
  loading: boolean = false;
  verificationSent: boolean = false;
  em: string;
  pw: string;

  promoRedeemed: boolean = false;
  promoError: string = '';
  discountMessage: string = '';
  promotion: Promotion;

  buttonText: string = 'Send verification code';
  serverMessage: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private promotionService: PromotionService
  ) { }

  ngOnInit(): void {
    this.formP1 = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6), Validators.required]],
      passwordConfirm: ['', []],
      termsAccept: [false, [Validators.requiredTrue]],
    });

    this.formP2 = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      verificationCode: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.promoForm = this.fb.group({
      promoCode: [''],
    })
  }

  get email() {
    return this.formP1.get('email');
  }
  
  get password() {
    return this.formP1.get('password');
  }

  get passwordConfirm() {
    return this.formP1.get('passwordConfirm');
  }

  get name() {
    return this.formP2.get('name');
  }

  get lastName() {
    return this.formP2.get('lastName');
  }

  get verificationCode() {
    return this.formP2.get('verificationCode');
  }

  get passwordDoesMatch() {
    if (this.verificationSent) {
      return true;
    } else {
      return this.password!.value === this.passwordConfirm!.value;
    }
  }

  get promoCode() {
    return this.promoForm.get('promoCode');
  }

  async redeemPromotion() {
    if (this.promoCode!.value.split('').length != 0) {
      this.promotion = await this.promotionService.getPromotion(this.promoCode!.value, this.email!.value, 0, false);
      if (this.promotion.type == 'noExist') {
        this.promoError = "This code doesn't exist, make sure you've written it correctly.";
      } else if (this.promotion.type == 'used') {
        this.promoError = "You have already used this code.";
      } else if (this.promotion.type == 'error' || this.promotion.type == undefined) {
        this.promoError = "Something went wrong while redeeming the code, please try again later."
      } else {
        this.discountMessage = this.discountString(this.promotion);
        this.promoRedeemed = true;
      }
    } else {
      this.promoError = 'You need to enter a promo code.';
    }
  }

  async onSubmit() {
    this.loading = true;

    try {
      if (!this.verificationSent) {
        this.em = this.email!.value;
        this.pw = this.password!.value;
        const res = await Auth.signUp({username: this.em, password: this.pw});
        this.verificationSent = true;
        this.serverMessage = '';
        this.buttonText = 'Confirm signup';
      } else {
        let res = await Auth.confirmSignUp(this.em, this.verificationCode!.value);
        const user = await Auth.signIn(this.em, this.pw);
        res = await Auth.updateUserAttributes(user, {
          'name': this.name!.value,
          'family_name': this.lastName!.value,
          'custom:group': 'user',
        });
        const signupPromo = await this.promotionService.getPromotion('signup', this.em, 0);
        if (this.promoRedeemed) await this.promotionService.applyPromotion(this.promoCode!.value, this.promotion, this.em, signupPromo.freePeriods);
        await this.authService.registerSignIn();
        this.router.navigateByUrl('/home');
      }
    } catch (err) {
      console.error('Error signing up: ' + err);
      this.serverMessage = String(err).split(': ')[1];
      this.loading = false;
    }

    this.loading = false;
  }

  setCreate(val: boolean) {
    this.authService.setCreate(false);
  }

  async resendCode() {
    try {
      await Auth.resendSignUp(this.em);
    } catch (err) {
      console.error('Error while resending mail: ' + err);
      this.serverMessage = String(err).split(': ')[1];
    }
  }

  discountString(promotion: Promotion): string {
    if (promotion.type == 'benefit' && promotion.freePeriods > 0) {
      return 'Benefit user (-40% on all purchases) and ' + promotion.freePeriods + ' free credit(s)';
    } else if (promotion.type == 'benefit' && promotion.freePeriods == 0) {
      return 'Benefit user (-40% on all purchases)';
    } else if (promotion.type == 'dev') {
      return 'Developer user (everything is free)';
    } else {
      return promotion.freePeriods + ' free credits';
    }
  }
}
