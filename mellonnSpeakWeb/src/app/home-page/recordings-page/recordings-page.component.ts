import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataStore, Predicates, SortDirection } from '@aws-amplify/datastore';
import { Recording } from 'src/models';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { Router } from '@angular/router';

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
  offset: number;

  uploadActive: boolean = false;
  uploadFile: File;

  constructor(public authService: AuthService, private router: Router) { }

  async ngOnInit() {
    this.offset = (new Date().getTimezoneOffset());
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
        sort: (s) => s.date(SortDirection.DESCENDING),
      });
      this.recordings = recordings;
    } catch (err) {
      console.log('error getting recordings', err);
    }
  }

  openRecording(recording: Recording) {
    if (typeof recording.fileUrl === "string") {
      this.router.navigateByUrl('/home/transcription/' + recording.id);
    } else {
      alert('The selected recording is currently being transcribed, this can take some time depending on the length of the audio clip. If this takes longer than 2 hours, please contact Mellonn by using Report issue on the profile page.');
    }
  }

  onFileDropped(file: File) {
    this.uploadFile = file;
    this.uploadActive = true;
  }
}
