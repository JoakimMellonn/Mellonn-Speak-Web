import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Recording } from 'src/models';
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

  constructor(private route: ActivatedRoute, private service: TranscriptionService) { }

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
    this.speakerWithWords = this.service.processTranscription(this.transcription);
  }
}