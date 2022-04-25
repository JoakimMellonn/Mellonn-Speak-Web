import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Recording } from 'src/models';
import { AudioService } from './audio.service';
import { Transcription } from './transcription';
import { TranscriptionService, SpeakerWithWords } from './transcription-service.service';


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

  constructor(private route: ActivatedRoute, private service: TranscriptionService, private audio: AudioService) { }

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
    const url = await this.audio.getAudioUrl(this.recording.fileKey ?? '');
    this.audio.setAudioUrl(url);
    this.speakerWithWords = this.service.processTranscription(this.transcription);
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

  async startAudio() {
    this.audio.play();
  }

  setClip() {
    this.audio.setStartEnd(7, 14);
  }
}