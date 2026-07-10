import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../services/auth.service';
import { LoginRequest } from '../../../../models';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent {

  loading = false;

  error = '';

  loginData: LoginRequest = {

    username: '',
    password: ''

  };

  constructor(

    private authService: AuthService,
    private router: Router

  ) { }

  login(): void {

    if (!this.loginData.username || !this.loginData.password) {

      this.error = 'Please enter username and password.';
      return;

    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginData).subscribe({

      next: (response) => {

        this.loading = false;

        if (response.success) {

          console.log('Login Successful');

          console.log(response.data);

          this.router.navigate(['/invoice-entry']);

        }
        else {

          this.error = response.message;

        }

      },

      error: (err) => {

        this.loading = false;

        console.error(err);

        if (err.status === 401) {

          this.error = 'Invalid username or password.';

        }
        else {

          this.error = 'Something went wrong. Please try again.';

        }

      }

    });

  }

  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
    {
      image: 'assets/images/authentication/twitter.svg',
      name: 'Twitter'
    },
    {
      image: 'assets/images/authentication/facebook.svg',
      name: 'Facebook'
    }
  ];

}