import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { pl } from './i18n/pl';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly labels = pl;
}
