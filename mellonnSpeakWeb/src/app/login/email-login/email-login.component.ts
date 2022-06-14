import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'aws-amplify';
import { AuthService } from 'src/app/shared/auth-service/auth.service';

@Component({
  selector: 'app-email-login',
  templateUrl: './email-login.component.html',
  styleUrls: ['./email-login.component.scss']
})
export class EmailLoginComponent implements OnInit {
  form: FormGroup;
  formConfirm: FormGroup;
  em: string;
  pw: string;

  type: 'login' | 'reset' | 'confirm';
  loading = false;
  verificationSent: boolean = false;
  buttonString: string;

  serverMessage: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.minLength(6), Validators.required]
      ],
      passwordConfirm: ['', []]
    });

    this.formConfirm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      confirmCode: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.changeType("login");
  }

  changeType(val: 'login' | 'reset' | 'confirm') {
    this.type = val;
    const email = this.email!.value;
    this.serverMessage = '';

    if (val == 'login') {
      this.authService.setForgotState(false);
      this.buttonString = 'Log in';
      this.form = this.fb.group({
        email: [email, [Validators.required, Validators.email]],
        password: ['', [Validators.minLength(6), Validators.required]],
        passwordConfirm: ['', []]
      });
    } else if (val == 'reset') {
      this.authService.setForgotState(true);
      this.buttonString = 'Send verification code';
      this.form = this.fb.group({
        email: [email, [Validators.required, Validators.email]]
      });
    }
  }

  get isLogin() {
    return this.type === 'login';
  }

  get isPasswordReset() {
    return this.type === 'reset';
  }

  get isConfirm() {
    return this.type === 'confirm';
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get passwordConfirm() {
    return this.form.get('passwordConfirm');
  }

  get verificationCode() {
    return this.form.get('verificationCode');
  }

  get name() {
    return this.formConfirm.get('name');
  }

  get lastName() {
    return this.formConfirm.get('lastName');
  }

  get confirmCode() {
    return this.formConfirm.get('confirmCode');
  }

  get passwordDoesMatch() {
    if (this.type !== 'reset' || !this.verificationSent) {
      return true;
    } else {
      return this.password!.value === this.passwordConfirm!.value;
    }
  }

  async onSubmit() {
    this.loading = true;

    try {
      if (this.isConfirm) {
        let res = await Auth.confirmSignUp(this.em, this.confirmCode!.value);
        const user = await Auth.signIn(this.em, this.pw);
        res = await Auth.updateUserAttributes(user, {
          'name': this.name!.value,
          'family_name': this.lastName!.value,
          'custom:group': 'user'
        });
        await this.authService.updateFreePeriods(1);
        this.authService.registerSignIn();
        this.router.navigateByUrl('/home');
      }
      if (this.isLogin) {
        this.em = this.email!.value;
        this.pw = this.password!.value;
        const user = await Auth.signIn(this.em, this.pw);
        this.authService.registerSignIn();
        this.router.navigateByUrl('/home');
      }
      if (this.isPasswordReset && this.verificationSent) {
        const res = await Auth.forgotPasswordSubmit(this.email!.value, this.verificationCode!.value, this.password!.value);
        console.log(res);
        if (res == 'SUCCESS') {
          const user = await Auth.signIn(this.email!.value, this.password!.value);
          this.authService.registerSignIn();
          this.router.navigateByUrl('/home');
        }
      }
      if (this.isPasswordReset && !this.verificationSent) {
        //Send verification code
        this.serverMessage = 'Check your email';
        this.buttonString = 'Change password';
        this.verificationSent = await this.authService.forgotPassword(this.email!.value);
        if (!this.verificationSent) throw this.authService.forgetPasswordError;
        const msg = document.getElementById('msg');
        this.renderer.setStyle(msg, 'color', '#A5C644');
        this.form = this.fb.group({
          email: [this.email!.value, [Validators.required, Validators.email]],
          password: [
            '',
            [Validators.minLength(6), Validators.required]
          ],
          passwordConfirm: ['', []],
          verificationCode: ['', [Validators.required, Validators.minLength(6)]]
        });
      }
    } catch (err) {
      if (err == 'UserNotConfirmedException: User is not confirmed.') {
        this.changeType('confirm');
        this.loading = false;
        return;
      }
      console.log('Error during sign in/sign up: ', err);
      this.serverMessage = String(err).split(': ')[1].replace('username', 'email').replace('Username', 'Email');
      const msg = document.getElementById('msg');
      this.renderer.setStyle(msg, 'color', '#FD594D');
    }

    this.loading = false;
  }

  async resendCode() {
    try {
      await Auth.resendSignUp(this.em);
    } catch (err) {
      console.log('Error while resending mail: ' + err);
      this.serverMessage = String(err).split(': ')[1];
    }
  }
}
