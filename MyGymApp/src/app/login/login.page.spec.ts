import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let mockRouter: jasmine.SpyObj<Router>
  let mockApiService: jasmine.SpyObj<ApiService>

  beforeEach(async() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockApiService = jasmine.createSpyObj('ApiService', ['sendPostRequest']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule, RouterTestingModule, LoginPage],
      providers:[
        {provide: Router, useValue: mockRouter},
        {provide: ApiService, useValue: mockApiService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.usernameOrEmail).toBe('');
    expect(component.password).toBe('');
  });

  it('should navigate to forgot password page', () => {
    component.onForgotPassword();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });

  it('should navigate to register page', () => {
    component.onRegister();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
  })
  
  it('should call API with email when email is provided', async() => {
    component.usernameOrEmail = 'test@example.com';
    component.password = 'password123';
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 200}));

    await component.onLogin();

    expect(mockApiService.sendPostRequest).toHaveBeenCalledWith(
      {email: 'test@example.com', password: 'password123'},
      'login'
    );
  });

  it('should call API with username is provided', async () => {
    component.usernameOrEmail = 'testuser';
    component.password = 'password123';
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 200}));

    await component.onLogin();

    expect(mockApiService.sendPostRequest).toHaveBeenCalledWith(
      { username: 'testuser', password: 'password123'},
      'login'
    );
  });

  it('should navigate to home page on successful login', async () =>{
      mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 200}));
      await component.onLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should set userError on 400 response', async() => {
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 400}));
    await component.onLogin();
    expect(component.userError).toBeTrue();
  });

  it('should set serverError on 500 repsonse', async() => {
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 500}));
    await component.onLogin();
    expect(component.serverError).toBeTrue();
  })

  it('should handle API errors', async () => {
    spyOn(console, 'error');
    mockApiService.sendPostRequest.and.returnValue(Promise.reject('API error'));
    await component.onLogin();
    expect(console.error).toHaveBeenCalledOnceWith('API error');
  })
}); 