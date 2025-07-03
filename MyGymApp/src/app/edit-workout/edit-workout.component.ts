import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonItem, IonLabel, IonTextarea, IonIcon } from '@ionic/angular/standalone';
import { Exercise } from '../models/exercise.model';
import { pencilSharp} from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({
  'pen-sharp': pencilSharp
});
@Component({
  selector: 'app-edit-workout',
  templateUrl: './edit-workout.component.html',
  styleUrls: ['./edit-workout.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonItem, IonLabel, IonTextarea, IonIcon, CommonModule],
})
export class EditWorkoutComponent  implements OnInit {
  @Input() workoutID!: number

  exerciseArr: Exercise[] = [];
  exerciseError: boolean = false;

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal()
  {
    this.modalController.dismiss();
  }
  viewExercise(index: number): void
  {
    this.exerciseArr[index].saved = !this.exerciseArr[index].saved;
  }
  saveWorkout(){
    //Make API call to save changes to workout
  }
}
