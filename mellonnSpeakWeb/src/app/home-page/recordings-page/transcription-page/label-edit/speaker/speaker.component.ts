import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { LabelService } from '../label.service';

@Component({
  selector: 'app-speaker',
  templateUrl: './speaker.component.html',
  styleUrls: ['./speaker.component.scss']
})
export class SpeakerComponent implements OnInit {
  speakerL: string = '';
  chosenType: string = 'Interviewee';
  value: string = 'Hello';

  @Input() speaker: number;
  @Input() initialValue: string;

  constructor(private renderer: Renderer2, private labelService: LabelService) { }

  ngOnInit(): void {
    this.value = this.initialValue;
    this.speakerL = 'spk_' + this.speaker;
    for (let interviewer of this.labelService.unsavedInterviewerList) {
      if (interviewer == this.speakerL) {
        this.chosenType = 'Interviewer';
        break;
      }
    }
  }

  setChosenType(type: string) {
    this.chosenType = type;

    if (type == 'Interviewer') {
      if (!this.labelService.unsavedInterviewerList.includes(this.speakerL)) {
        this.labelService.unsavedInterviewerList[this.speaker] = this.speakerL;
      }
    } else {
      if (this.labelService.unsavedInterviewerList.includes(this.speakerL)) {
        this.labelService.unsavedInterviewerList[this.speaker] = '';
      }
    }
    console.log('Interviewers: ' + this.labelService.unsavedInterviewerList);
  }

  onTextChange() {
    this.labelService.unsavedLabelList[this.speaker] = this.value;
  }
}
