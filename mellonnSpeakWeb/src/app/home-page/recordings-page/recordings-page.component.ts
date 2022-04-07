import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth } from 'aws-amplify';
import { DataStore, Predicates, SortDirection } from '@aws-amplify/datastore';
import { Recording } from 'src/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recordings-page',
  templateUrl: './recordings-page.component.html',
  styleUrls: ['./recordings-page.component.scss']
})
export class RecordingsPageComponent implements OnInit {
  firstName: string = '';
  lastName: string = '';
  recordings: Recording[] = [];

  constructor(private router: Router) { }

  async ngOnInit() {
    await this.getUser();
    await this.getRecordings();
  }

  async getUser() {
    try {
      const user = await Auth.currentUserInfo();
      this.firstName = user.attributes.name;
      this.lastName = user.attributes.family_name;
    } catch (err) {
      console.log('error getting user', err);
    }
  }

  async getRecordings() {
    try {
      const recordings = await DataStore.query(Recording, Predicates.ALL, {
        sort: (s) => s.date(SortDirection.ASCENDING),
      });
      console.log('recordings', recordings);
      this.recordings = recordings;
    } catch (err) {
      console.log('error getting recordings', err);
    }
  }

  async signOut() {
    try {
      await Auth.signOut();
      console.log('User is signed out');
      this.router.navigate(['/login']);

    } catch (err) {
      console.log('error signing out', err);
    }
  }
}
