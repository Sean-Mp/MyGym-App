import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { IonContent, IonIcon, IonHeader, IonToolbar, IonTitle, IonCard, IonButton, IonLabel, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { GlobalTabComponent } from '../global-tab/global-tab.component';
import { ApiService } from '../api.service';
import { StorageService } from '../storage.service';
import { pencilSharp, addSharp} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Workout } from '../models/workout.model';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { ViewWorkoutComponent } from '../view-workout/view-workout.component';
import { EditWorkoutComponent } from '../edit-workout/edit-workout.component';
import { AddWorkoutComponent } from '../add-workout/add-workout.component';

addIcons({
  'pen-sharp': pencilSharp,
  'add-sharp': addSharp
});
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonLabel, IonButton, IonIcon, IonCard, IonTitle, IonToolbar, IonHeader, IonContent, CommonModule, FormsModule, GlobalTabComponent, RouterOutlet]
})

export class HomePage implements OnInit {

  constructor(
    private apiService: ApiService, 
    private storage: StorageService, 
    private router: Router,
    private modalController: ModalController) { }

  ngOnInit() {
    // this.fetchProfile()
  }

  async fetchProfile() {
    const centerCards = document.getElementById('flex-center');
    try{

      this.router.navigate(['loader']);
      const userID = await this.storage.get('userID');

      const req1 = {
        user_id: userID,
        type: 'profile'
      };

      const req2 = {
        user_id: userID,
        type: 'workout'
      };
      
      try{
        const responseProfile = await this.apiService.sendGetRequest(req1, "user");
        const responseWorkout = await this.apiService.sendGetRequest(req2, "user");

        if(responseProfile.status === 200 && responseWorkout.status === 200)
        {
          const welcomeUserElement = document.getElementById('welcome-user');
          if (welcomeUserElement) {
            welcomeUserElement.innerHTML = `Hi, ${responseProfile.data.username}`;
          }

          if(centerCards && responseWorkout.data.length > 0) {

            // Clear previous content
            centerCards.innerHTML = ''; 
    
            responseWorkout.data.forEach((workout: Workout) => {

              const workoutCards = document.createElement('ion-card');
              workoutCards.className = 'workout-card';
              
              const workoutViewButton = document.createElement('ion-button');
              workoutViewButton.className = 'workout-button';
              workoutViewButton.color = "danger";

              const workoutDiv = document.createElement('div');
              workoutDiv.className = 'workout-div';

              const leftNameDiv = document.createElement('div');
              leftNameDiv.className = 'left';

              const workoutLabel = document.createElement('ion-label');
              workoutLabel.className = 'workout-name';
              workoutLabel.innerHTML = `${workout.workout_name}`;
              leftNameDiv.appendChild(workoutLabel);

              const centerDateDiv = document.createElement('div');
              centerDateDiv.className = "center";

              const workoutDate = document.createElement('ion-label');
              workoutDate.className = 'workout-date';
              workoutDate.innerHTML = `Last workout:<br> ${workout.last_workout}`;
              centerDateDiv.appendChild(workoutDate);

              const rightIconDiv = document.createElement('div');
              rightIconDiv.className = "right";

              const editWorkoutButton = document.createElement('ion-button');
              editWorkoutButton.shape = "round";
              const editWorkoutIcon = document.createElement('ion-icon');
              editWorkoutIcon.slot = "icon-only";
              editWorkoutIcon.name = 'pen-sharp';
              editWorkoutButton.appendChild(editWorkoutIcon);
              rightIconDiv.appendChild(editWorkoutButton);

              editWorkoutButton.addEventListener('click', () => {
                this.editWorkout(workout.workout_id);
              });

              workoutDiv.appendChild(leftNameDiv);
              workoutDiv.appendChild(centerDateDiv);
              workoutDiv.appendChild(rightIconDiv);

              workoutViewButton.appendChild(workoutDiv);

              workoutViewButton.addEventListener('click', () => {
                this.viewWorkoutInfo(workout.workout_id);
              });

              workoutCards.appendChild(workoutViewButton);
              centerCards.appendChild(workoutCards);
            });
          }
        }
        else
        {
          if(centerCards) {
            const workoutDiv = document.createElement('div');
            workoutDiv.className = 'error-div';
            const errorMessage = document.createElement('ion-label');
            errorMessage.innerHTML = 'Error fetching workout data. Please try again.';
            workoutDiv.appendChild(errorMessage);
            centerCards.appendChild(workoutDiv);
          }
        }
      }
      catch(error){
        console.error(error);

        if(centerCards)
        {
          const workoutDiv = document.createElement('div');
          workoutDiv.className = 'error-div';
          const errorMessage = document.createElement('ion-label');
          errorMessage.innerHTML = 'Error fetching workout data. Please try again.';
          workoutDiv.appendChild(errorMessage);
          centerCards.appendChild(workoutDiv);
        }
      }
    }
    catch(error) {
      console.error(error);

      if(centerCards) {
        const workoutDiv = document.createElement('div');
        workoutDiv.className = 'error-div';
        const errorMessage = document.createElement('ion-label');
        errorMessage.innerHTML = 'Error fetching data. Please try logging in again.';
        workoutDiv.appendChild(errorMessage);
        centerCards.appendChild(workoutDiv);
      }
    }
    finally{
      this.router.navigate(['/home']);
    }
  }
  async viewWorkoutInfo(workoutID: number){
    const modal = await this.modalController.create({
      component: ViewWorkoutComponent,
      componentProps: { workoutID: workoutID }
    });
    return await modal.present();
  }
  async editWorkout(workoutID: number) {
    const modal = await this.modalController.create({
      component: EditWorkoutComponent,
      componentProps: { workoutID: workoutID }
    });
    return await modal.present();
  }
  async createWorkout()
  {
    const modal = await this.modalController.create({
      component: AddWorkoutComponent, 
    });
    return await modal.present();
  }
}
