import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  jumpSecs: number = 3;

  constructor() { }
}
