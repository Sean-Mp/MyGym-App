import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addSharp} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonHeader, IonTextarea, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonItem, IonInput, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { Exercise } from '../models/exercise.model';
import { StorageService } from '../storage.service';
import { ApiService } from '../api.service';

addIcons({
  'add-sharp': addSharp
});
@Component({
  selector: 'app-add-workout',
  templateUrl: './add-workout.component.html',
  styleUrls: ['./add-workout.component.scss'],
  imports: [IonHeader, IonTextarea, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonItem, IonInput, IonLabel, IonIcon, FormsModule, CommonModule],
  providers: [ModalController]
})
export class AddWorkoutComponent  implements OnInit {

  workoutName: string = "";
  exerciseArr: Exercise[] = [];
  exerciseError: boolean = false;
  isSaved: boolean = false;

  constructor(private modalController: ModalController, private storage: StorageService, private apiService: ApiService) { }

  ngOnInit() {}

  closeModal(){
    this.modalController.dismiss();
  }
  async addWorkout()
  {
    const usedID = await this.storage.get('userID');
    //Call API to create workout and then add each exercise
    const req = {
      type: 'workout',
      workout_name: this.workoutName,
      user_id: usedID,
    };

    try{
      const response = await this.apiService.sendPutRequest(req, "user"); 

      if(response.status === 200)
      {
        for (const exercise of this.exerciseArr) {
            const req = {
              type: 'exercise',
              workout_id: response.workout_id,
              exercise_name: exercise.exercise_name,
              rep_range: exercise.rep_range,
              sets: exercise.sets,
              current_weight: exercise.current_weight,
              goal_weight: exercise.goal_weight,
              notes: exercise.notes,
            };
            const exerciseResponse = await this.apiService.sendPutRequest(req, "user");
    
            if (exerciseResponse.status === 200) {
              this.modalController.dismiss();
            } 
            else if (exerciseResponse.status === 400) {
              this.exerciseError = true;
            }
        }
      }
      else if(response.status === 400)
      {
        this.exerciseError = true;
      }
      }
    catch(error)
    {
      console.error(error);
      this.exerciseError = true;
    }
  }
  createExercise()
  {
    const newExercise: Exercise = {
      exercise_name: '',
      rep_range: [],
      sets: 0,
      current_weight: 0,
      goal_weight: 0,
      notes: '',
      saved: false
    };

    this.exerciseArr.push(newExercise);
  }
  saveExercise(exercise: Exercise)
  {
    const isValidRepRange = Array.isArray(exercise.rep_range) && exercise.rep_range.length === 2;
    const isFilled = 
      exercise.exercise_name.trim() !== '' &&
      exercise.current_weight > 0 &&
      exercise.goal_weight > 0;

    if(!isValidRepRange || !isFilled)
    {
      this.exerciseError = true;
      return;
    }

    this.exerciseError = false;
    exercise.saved = true;

  }
  getRepArr(rep_range: string): number[] 
  {
    if(!rep_range)
    {
      return [];
    }
    const repArr = rep_range.split('-').map(rep => parseInt(rep.trim(), 10));
    return repArr.every(Number.isFinite) ? repArr : [];
  }

}