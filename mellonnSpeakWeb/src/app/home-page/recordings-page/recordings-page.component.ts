import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataStore, Predicates, SortDirection } from '@aws-amplify/datastore';
import { Recording } from 'src/models';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { Router } from '@angular/router';
import { UploadService } from 'src/app/shared/upload-service/upload.service';
import { PromotionService } from 'src/app/shared/promotion-service/promotion.service';

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

  currentMode: 'default' | 'upload' | 'admin' | 'onboarding' = 'default';

  currentOnboardingPage: number = 0;

  uploadFile: File;

  constructor(
    public authService: AuthService,
    public uploadService: UploadService,
    private router: Router,
    private promotionService: PromotionService
  ) { }

  async ngOnInit() {
    this.offset = (new Date().getTimezoneOffset());
    await this.authService.getUserInfo();
    await this.getRecordings();
    this.subscription = DataStore.observe(Recording).subscribe(rec => {
      this.getRecordings();
    });

    this.uploadService.uploadDoneCalled.subscribe((res) => {
      if (res == true) this.currentMode = 'default';
    });
    this.promotionService.switchCurrentModeCalled.subscribe((res) => {
      this.currentMode = res;
    });

    if (!this.authService.isOnboarded) {
      this.currentMode = 'onboarding';
    }

    this.loading = false;
  }

  ngOnDestroy() {
    if (!this.subscription) return;
    this.subscription.unsubscribe();
    this.recordings = [];
  }

  setOnboardingPage(page: number) {
    this.currentOnboardingPage = page;
  }

  doneOnboarding() {
    this.currentMode = 'default';
    this.authService.setOnboarded();
  }

  async getRecordings() {
    try {
      const recordings = await DataStore.query(Recording, Predicates.ALL, {
        sort: (s) => s.date(SortDirection.DESCENDING),
      });
      this.recordings = recordings;
    } catch (err) {
      console.error('error getting recordings', err);
    }
  }

  openRecording(recording: Recording) {
    if (typeof recording.fileUrl === "string") {
      this.router.navigateByUrl('/home/transcription/' + recording.id);
    } else {
      alert('The selected recording is currently being transcribed, this can take some time depending on the length of the audio clip. If this takes longer than 2 hours, please contact Mellonn by using Report issue on the profile page.');
    }
  }

  onUploadChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;

    if (files.length == 1) {
      if (files[0].name.toLowerCase().match(/\.(wav|flac|m4p|m4a|m4b|mmf|aac|mp3|mp4|MP4)$/i)) {
        this.onFileDropped(files[0]);
      } else {
        alert('This file type is not supported, a list of supported file types can be found here: www.mellonn.com/speak-help');
      }
    } else if (files.length > 1) {
      alert('You can only upload one file at the time...');
    }
  }

  onFileDropped(file: File) {
    this.uploadFile = file;
    this.currentMode = 'upload';
  }
}
