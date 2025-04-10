import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-edit-workout',
  templateUrl: './edit-workout.component.html',
  styleUrls: ['./edit-workout.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent],
})
export class EditWorkoutComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal()
  {
    this.modalController.dismiss();
  }
  saveWorkout(){
    //Make API call to save changes to workout
  }
}
