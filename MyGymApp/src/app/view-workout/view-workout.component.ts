import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonLabel, IonItem, IonTextarea } from '@ionic/angular/standalone';
import { EditWorkoutComponent } from '../edit-workout/edit-workout.component';
import { Exercise } from '../models/exercise.model';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-view-workout',
  templateUrl: './view-workout.component.html',
  styleUrls: ['./view-workout.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonLabel, IonItem, IonTextarea, CommonModule],
})
export class ViewWorkoutComponent  implements OnInit {
  @Input() workoutID!: number;

  exerciseArr: Exercise[] = [];
  exerciseError: boolean = false;

  constructor(private modalController: ModalController, private apiService: ApiService) { }

  async ngOnInit() {
    //make API call to get exercises
    const req = {
      type: 'exercise',
      workout_id: this.workoutID
    };
    
    try{
      const response = await this.apiService.sendGetRequest(req, '/user');

      if(response.status == 200)
      {
        response.data.forEach((exercise : Exercise) => {
          this.exerciseArr.push(exercise);
        })
      }
    }
    catch(error)
    {
      this.exerciseError = true;
    }
  }

  closeModal()
  {
    this.modalController.dismiss();
  }
  async startWorkout()
  {
    const req = {
      type: "workout",
      workout_id: this.workoutID,
      update: 'date'
    }
    
    try{
      const response = await this.apiService.sendPatchRequest(req, "/user");

      if(response.status === 200)
      {
        this.closeModal();
      }
    }
    catch(error)
    {
      this.exerciseError = true;
    }
  }
  editWorkout()
  {
    this.modalController.dismiss();
    this.modalController.create({
      component: EditWorkoutComponent
    }).then((modal) => {
      modal.present();
    });
  }

}
