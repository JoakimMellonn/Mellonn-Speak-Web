import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocxService } from 'src/app/shared/docx-service/docx.service';
import { Recording } from 'src/models';
import { AudioService } from './services/audio.service';
import { Transcription } from './transcription';
import { TranscriptionService, SpeakerWithWords } from './services/transcription-service.service';
import { SpeakerEditService } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
import { LabelService } from './label-edit/label.service';
import { VersionHistoryService } from './version-history/version-history.service';


@Component({
  selector: 'app-transcription-page',
  templateUrl: './transcription-page.component.html',
  styleUrls: ['./transcription-page.component.scss']
})

export class TranscriptionPageComponent implements OnInit {
  id: string;
  transcription: Transcription;
  recording: Recording;
  speakerWithWords: SpeakerWithWords[];
  loading: boolean = true;
  error: boolean = false;
  url: string;
  dropdownShown: boolean = false;
  labelEditOpen: boolean = false;
  versionHistoryOpen: boolean = false;
  infoOpen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private service: TranscriptionService,
    private audio: AudioService,
    private docx: DocxService,
    private speakerEdit: SpeakerEditService,
    private labelService: LabelService,
    private versionHistory: VersionHistoryService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.service.getTranscription(this.id).then((value) => {
      if (value != 'null') {
        this.transcription = value;
      } else {
        this.error = true;
      }
    });
    await this.service.getRecording(this.id).then((value) => {
      if (value != 'null') {
        this.recording = value;
        this.loading = false;
      } else {
        this.error;
      }
    });
    if (this.recording.labels == [] || this.recording.labels == null || this.recording.labels == undefined || this.recording.labels.length != this.recording.speakerCount) {
      this.labelEditOpen = true;
    }
    this.url = await this.audio.getAudioUrl(this.recording.fileKey ?? '');
    this.audio.setAudioUrl(this.url);
    this.speakerWithWords = this.service.processTranscription(this.transcription);

    this.speakerEdit.speakerEditReloadCalled.subscribe((res) => {
      this.reloadTranscription(res);
    });

    this.labelService.closeModalCalled.subscribe(async (res) => {
      await this.service.getRecording(this.id).then((value) => {
        if (value != 'null') {
          this.recording = value;
          this.loading = false;
        } else {
          this.error;
        }
      });
      this.labelEditOpen = false;
    });

    this.versionHistory.recoverTransCalled.subscribe(async (res) => {
      await this.service.getTranscription(this.id).then((value) => {
        if (value != 'null') {
          this.transcription = value;
        } else {
          this.error = true;
        }
      });
      this.versionHistoryOpen = false;
    });
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

  downloadDOCX() {
    this.docx.generateDOCX(this.speakerWithWords, this.recording);
  }

  startAudio() {
    this.audio.play();
  }

  pauseAudio() {
    this.audio.pause();
  }

  resetAudio() {
    this.audio.resetState();
  }

  reloadTranscription(trans: Transcription) {
    this.transcription = trans;
    this.speakerWithWords = this.service.processTranscription(trans);
  }

  async deleteRecording() {
    if (confirm('Are you ABSOLUTELY sure you want to delete this recording? This can NOT be undone')) {
      await this.service.deleteTranscription(this.recording);
      this.router.navigate(['/']);
    }
  }
}