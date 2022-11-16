import { Component, Input, OnInit } from '@angular/core';
import { DataStore, SortDirection, Storage } from 'aws-amplify';
import { Recording, Version } from 'src/models';
import { SpeakerWithWords, TranscriptionService } from '../services/transcription-service.service';
import { Transcription } from '../transcription';
import { VersionHistoryService } from './version-history.service';

@Component({
  selector: 'app-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.scss']
})
export class VersionHistoryComponent implements OnInit {
  subscription: any;
  versions: Version[];
  loading: boolean = true;
  currentTrans: Transcription;
  currentSWW: SpeakerWithWords[];
  transcriptionActive: boolean = false;

  @Input() recording: Recording;

  constructor(private transService: TranscriptionService, private versionService: VersionHistoryService) { }

  async ngOnInit() {
    await this.getVersions();
    this.subscription = DataStore.observe(Version).subscribe(rec => {
      this.getVersions();
    });
    this.loading = false;
  }

  async getVersions() {
    try {
      const versions = await DataStore.query(Version, version => version.recordingID("eq", this.recording.id), {
        sort: (s) => s.date(SortDirection.DESCENDING),
      });
      this.versions = versions;
    } catch (err) {
      console.error('error getting recordings', err);
    }
  }

  async showTranscription(versionId: string) {
    const key = 'versions/' + this.recording.id + '/' + versionId + '.json';
    let transcription: Transcription;

    try {
      const url = await Storage.get(key, {level: 'private', expires: 360});

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();
      transcription = result;
    } catch (err) {
      console.error('Error downloading file with key: ' + key + ', error: ' + err);
    }

    const speakerWithWords: SpeakerWithWords[] = this.transService.processTranscription(transcription!);
    this.currentSWW = speakerWithWords;
    this.currentTrans = transcription!;
    this.transcriptionActive = true;
  }

  async recoverTranscription() {
    if (confirm('Are you sure you want to recover the transcription to this state?')) {
      this.transService.setTranscription(this.currentTrans);
      await this.transService.saveTranscription(this.currentTrans, this.recording.id);
      await this.versionService.uploadVersion(this.recording.id, this.currentTrans, 'Recovered Version');
      this.versionService.recoverTranscription();
    }
  }

  getSpkNum(speakerLabel: string): number {
    const split = speakerLabel.split('_');
    return +split[split.length - 1];
  }

  getSpkLabel(speakerLabel: string): string {
    const num: number = this.getSpkNum(speakerLabel);
    if (this.recording.labels != null) {
      return this.recording.labels[num] ?? '';
    } else {
      return 'null';
    }
  }

  getTimeFrame(start_time: number, end_time: number): string {
    return this.getMinSec(start_time) + ' to ' + this.getMinSec(end_time);
  }

  getMinSec(secs: number): string {
    let minDouble: number = secs / 60;
    let minInt: number = Math.floor(minDouble);
    let secDouble: number = secs - (minInt * 60);
    let secInt: number = Math.floor(secDouble);

    let minSec: string = minInt + 'm' +  secInt + 's';
    let sec: string = secInt + 's';

    if (minInt == 0) {
      return sec;
    } else {
      return minSec;
    }
  }
}
