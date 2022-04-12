import { Component, OnDestroy, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth, syncExpression } from 'aws-amplify';
import { DataStore, Predicates, SortDirection } from '@aws-amplify/datastore';
import { Recording } from 'src/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recordings-page',
  templateUrl: './recordings-page.component.html',
  styleUrls: ['./recordings-page.component.scss']
})
export class RecordingsPageComponent implements OnInit, OnDestroy {
  firstName: string = '';
  lastName: string = '';
  recordings: Recording[] = [];
  loading: boolean = true;
  subscription: any;

  constructor() { }

  async ngOnInit() {
    await this.getUser();
    await this.getRecordings();
    this.subscription = DataStore.observe(Recording).subscribe(rec => {
      this.getRecordings();
    });
    this.loading = false;
  }

  ngOnDestroy() {
    if (!this.subscription) return;
    this.subscription.unsubscribe();
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
      this.recordings = recordings;
    } catch (err) {
      console.log('error getting recordings', err);
    }
  }
}
