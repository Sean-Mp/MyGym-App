import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from '../login/login.page';
import { ForgotPasswordPage } from './forgot-password.page';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let mockRouter: jasmine.SpyObj<Router>
  let mockApiService: jasmine.SpyObj<ApiService>

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockApiService = jasmine.createSpyObj('ApiService', ['sendPatchRequest']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule, RouterTestingModule, LoginPage],
      providers:[
        {provide: Router, useValue: mockRouter},
        {provide: ApiService, useValue: mockApiService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.email).toBe('');
  });

  it('should navigate to login page', () => {
    component.onLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call API with email when email is provided', async() => {
    component.email = 'test@example.com';
    mockApiService.sendPatchRequest.and.returnValue(Promise.resolve({status: 200}));

    await component.onForgotPassword();

    expect(mockApiService.sendPatchRequest).toHaveBeenCalledWith(
      {email: 'test@example.com'},
      'forgot-password'
    );
  });

  it('should display message on successful email sent', async () =>{
    mockApiService.sendPatchRequest.and.returnValue(Promise.resolve({status: 200}));
    await component.onForgotPassword();
    expect(component.userSuccess).toBeTrue();
  });

  it('should set userError on 400 response', async() => {
    mockApiService.sendPatchRequest.and.returnValue(Promise.resolve({status: 400}));
    await component.onForgotPassword();
    expect(component.userError).toBeTrue();
  });

  it('should set serverError on 500 repsonse', async() => {
    mockApiService.sendPatchRequest.and.returnValue(Promise.resolve({status: 500}));
    await component.onForgotPassword();
    expect(component.serverError).toBeTrue();
  });
});
