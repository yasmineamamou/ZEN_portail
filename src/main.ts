import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // ✅ Import provideAnimations
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { ReactiveFormsModule } from '@angular/forms';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { tokenInterceptor } from './app/token.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    provideAnimations(),
    importProvidersFrom(ReactiveFormsModule, FormsModule, CommonModule)
  ]
});
