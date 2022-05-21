import { Component, OnDestroy, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth, syncExpression } from 'aws-amplify';
import { DataStore, Predicates, SortDirection } from '@aws-amplify/datastore';
import { Recording } from 'src/models';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/auth-service/auth.service';

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

  constructor(public authService: AuthService) { }

  async ngOnInit() {
    await this.getRecordings();
    this.subscription = DataStore.observe(Recording).subscribe(rec => {
      this.getRecordings();
    });
    this.loading = false;
  }

  ngOnDestroy() {
    if (!this.subscription) return;
    this.subscription.unsubscribe();
    this.recordings = [];
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
