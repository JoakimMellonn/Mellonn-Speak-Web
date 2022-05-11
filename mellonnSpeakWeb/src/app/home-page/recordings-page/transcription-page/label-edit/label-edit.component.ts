import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Recording } from 'src/models';
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

  constructor(private labelService: LabelService) { }

  ngOnInit() {
    this.initLabel();
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.labelService.resetLabel();
  }

  initLabel() {
    const labels = this.recording.labels;
    const interviewers = this.recording.interviewers;

    if (labels == [] || labels == undefined || labels == null) {
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

    if (interviewers == [] || interviewers == undefined || interviewers == null) {
      this.labelService.unsavedInterviewerList.push('spk_0');
    } else {
      for (let interviewer of interviewers!) {
        this.labelService.unsavedInterviewerList.push(interviewer!);
      }
    }
    console.log('Labels: ' + this.labelService.unsavedLabelList);
    console.log('Interviewers: ' + this.labelService.unsavedInterviewerList);
  }

  async assignLabels() {
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