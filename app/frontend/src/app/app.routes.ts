import { Routes } from '@angular/router';
import { IntakeFormComponent } from './features/intake-form/intake-form.component';
import { ChatComponent } from './features/chat/chat/chat.component';

export const routes: Routes = [
  { path: '', component: IntakeFormComponent },
  { path: 'chat', component: ChatComponent },
  { path: '**', redirectTo: '' },
];
