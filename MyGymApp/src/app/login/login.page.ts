import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardTitle, IonItem, IonInput, IonCardHeader, IonCardContent, IonButton, IonLabel, IonCardSubtitle } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonLabel, IonButton, IonCardContent, IonCardHeader, IonItem, IonCardTitle, IonCard, IonContent, IonInput, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {

  usernameOrEmail: string = '';
  password: string = '';
  userError: boolean = false;
  serverError: boolean = false;

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
      
  }
  async onLogin(){ 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let req = {}

    if(emailRegex.test(this.usernameOrEmail))
    {
      req = {
        email: this.usernameOrEmail,
        password: this.password
      };
    }
    else
    {
      req = {
        username: this.usernameOrEmail,
        password: this.password
      };
    }

   try{
    const response = await this.apiService.sendPostRequest(req, "login");

    if(response.status === 200)
    {
      this.router.navigate(['/home']);
    }
    else if(response.status === 400)
    {
      this.userError = true;
    }
    else if(response.status === 500)
    {
      this.serverError = true;
    }
   }
   catch(error)
   {
    console.error(error);
  }
  }
  onForgotPassword(){
    this.router.navigate(['/forgot-password']);
  }
  onRegister(){
    this.router.navigate(['/register']);
  }
}
