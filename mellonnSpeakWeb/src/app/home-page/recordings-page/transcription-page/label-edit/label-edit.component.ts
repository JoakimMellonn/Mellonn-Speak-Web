import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Recording } from 'src/models';
import { AudioService } from '../services/audio.service';
import { SpeakerWithWords } from '../services/transcription-service.service';
import { LabelService } from './label.service';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss']
})
export class LabelEditComponent implements OnInit, OnDestroy {
  speakerLabels: SpeakerLabel[] = [];
  loading: boolean = true;

  @Input() recording: Recording;
  @Input() speakerWithWords: SpeakerWithWords[];

  constructor(private labelService: LabelService, private audio: AudioService) { }

  ngOnInit() {
    this.initLabel();
    this.audio.labelActive = true;
    this.labelService.speakerClips = this.labelService.getSpeakerClips(this.speakerWithWords, this.recording.speakerCount);

    this.audio.audioOnEndCalled.subscribe(() => {
      this.labelService.stopAudio();
    });

    this.audio.audioOnTimeUpdateCalled.subscribe(() => {
      if (this.audio.player.currentTime >= this.labelService.currentEnd) {
        this.labelService.stopAudio();
      }
    })

    this.loading = false;
  }

  ngOnDestroy(): void {
    this.audio.labelActive = false;
    this.labelService.resetLabel();
  }

  initLabel() {
    const labels = this.recording.labels;
    const interviewers = this.recording.interviewers;

    if (labels?.length == 0 || labels == undefined || labels == null) {
      for (let i = 0; i < this.recording.speakerCount; i++) {
        this.labelService.unsavedLabelList.push('Speaker ' + (i + 1));
        this.speakerLabels.push(new SpeakerLabel(
          'Speaker ' + (i + 1),
          i
        ));
      }
    } else {
      let i = 0;
      for (let label of labels!) {
        this.labelService.unsavedLabelList.push(label!);
        this.speakerLabels.push(new SpeakerLabel(
          label!,
          i
        ));
        i++;
      }
    }

    if (interviewers?.length == 0 || interviewers == undefined || interviewers == null) {
      this.labelService.unsavedInterviewerList.push('spk_0');
    } else {
      for (let interviewer of interviewers!) {
        this.labelService.unsavedInterviewerList.push(interviewer!);
      }
    }
  }

  async assignLabels() {
    this.audio.resetState();
    await this.labelService.assignLabels(this.recording);
  }

}

export class SpeakerLabel {
  label: string;
  index: number;

  constructor (label: string, index: number) {
    this.label = label,
    this.index = index
  }
}