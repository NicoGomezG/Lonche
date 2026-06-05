import { Component } from '@angular/core';
import { LandingComponent } from './components/landing/landing.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LandingComponent],
  template: '<app-landing></app-landing>'
})
export class AppComponent {}
