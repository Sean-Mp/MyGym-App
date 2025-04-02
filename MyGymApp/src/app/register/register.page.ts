import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCardTitle, IonCard, IonCardHeader, IonInput, IonItem, IonLabel, IonButton, IonCardContent, IonCardSubtitle } from '@ionic/angular/standalone';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonCardSubtitle, IonCardContent, IonButton, IonLabel, IonInput, IonItem, IonCardHeader, IonCard, IonCardTitle, IonContent, CommonModule, FormsModule]
})
export class RegisterPage implements OnInit {

  username: string = '';
  email: string = '';
  password: string = '';
  userError: boolean = false;
  userExistsError: boolean = false;
  serverError: boolean = false;

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit(): void {
  }

  async onRegister()
  {
    const req = {
      username: this.username,
      email: this.email, 
      password: this.password 
    };

    try{
      const response = await this.apiService.sendPostRequest(req, "signup");

      if(response.status === 200)
      {
        this.router.navigate(['/home']);
      }
      else if(response.status === 400)
      {
        this.userError = true;
      }
      else if(response.status === 403)
      {
        this.userExistsError = true;
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
  onLogin()
  {
    this.router.navigate(['/login']);
  }

}
