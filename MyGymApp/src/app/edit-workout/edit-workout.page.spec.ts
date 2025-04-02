import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditWorkoutPage } from './edit-workout.page';

describe('EditWorkoutPage', () => {
  let component: EditWorkoutPage;
  let fixture: ComponentFixture<EditWorkoutPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWorkoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
