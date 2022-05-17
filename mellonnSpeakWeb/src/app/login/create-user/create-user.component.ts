import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from 'aws-amplify';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { StorageService } from 'src/app/shared/storage-service/storage.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  formP1: FormGroup;
  formP2: FormGroup;
  loading: boolean = false;
  verificationSent: boolean = false;
  em: string;
  pw: string;

  buttonText: string = 'Send verification code';
  serverMessage: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.formP1 = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6), Validators.required]],
      passwordConfirm: ['', []]
    });

    this.formP2 = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      verificationCode: ['', [Validators.required, Validators.minLength(6)]]
    });
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

  async onSubmit() {
    this.loading = true;
    console.log('Hello');

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
          'custom:group': 'user'
        });
        await this.storageService.createUserData(this.em, 1);
        this.router.navigateByUrl('/home');
      }
    } catch (err) {
      console.log('Error signing up: ' + err);
      this.serverMessage = String(err).split(': ')[1];
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
      console.log('Error while resending mail: ' + err);
      this.serverMessage = String(err).split(': ')[1];
    }
  }
}
