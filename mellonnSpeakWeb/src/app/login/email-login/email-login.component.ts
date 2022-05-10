import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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

  type: 'login' | 'signup' | 'reset' = 'signup';
  loading = false;

  serverMessage: string;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.changeType("login");
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.minLength(6), Validators.required]
      ],
      passwordConfirm: ['', []]
    });
  }

  changeType(val: 'login' | 'signup' | 'reset' = 'signup') {
    this.type = val;
  }

  get isLogin() {
    return this.type === 'login';
  }

  get isSignup() {
    return this.type === 'signup';
  }

  get isPasswordReset() {
    return this.type === 'reset';
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

  get passwordDoesMatch() {
    if (this.type !== 'signup') {
      return true;
    } else {
      return this.password!.value === this.passwordConfirm!.value;
    }
  }


  async onSubmit() {
    console.log('onSubmit');
    this.loading = true;

    const email = this.email!.value;
    const password = this.password!.value;

    try {
      if (this.isLogin) {
        const user = await Auth.signIn(email, password);
        this.authService.signIn();
        this.router.navigateByUrl('/home');
      }
      if (this.isSignup) {
        //const { user } = await Auth.signUp(SignUpParams(email, password));
        //console.log(user);
      }
      if (this.isPasswordReset) {
        //await this.afAuth.sendPasswordResetEmail(email);
        this.serverMessage = 'Check your email';
      }
    } catch (err) {
      console.log('Error during signin/signup: ', err);
      this.serverMessage = String(err).split(': ')[1].replace('username', 'email');
    }

    this.loading = false;
  }
}
