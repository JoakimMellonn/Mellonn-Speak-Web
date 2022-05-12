import { AfterViewInit, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { TextEditService } from 'src/app/shared/text-edit-service/text-edit.service';
import { AudioService } from '../services/audio.service';
import { Transcription } from '../transcription';
import { SpeakerWithWords, TranscriptionService } from '../services/transcription-service.service';
import { Speaker } from '../speaker-chooser/speaker-chooser.component';
import { SpeakerEditService } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
import { Recording } from 'src/models';
import { VersionHistoryService } from '../version-history/version-history.service';

@Component({
  selector: 'app-user-chat-bubble',
  templateUrl: './user-chat-bubble.component.html',
  styleUrls: ['./user-chat-bubble.component.scss']
})
export class UserChatBubbleComponent implements AfterViewInit, OnInit {
  changed: boolean = false;
  selected: boolean = false;
  text: string = '';
  speakerList: Speaker[] = [];
  selectedSpeaker: number = 0;
  selection: number[] = [];
  lastSelection: number[] = [0, 0];

  @Input() sww!: SpeakerWithWords;
  @Input() isUser!: boolean;
  @Input() transcription!: Transcription;
  @Input() recording!: Recording;

  constructor(
    private renderer: Renderer2,
    private textEdit: TextEditService,
    private audio: AudioService,
    private speakerEdit: SpeakerEditService,
    private transService: TranscriptionService,
    private versionService: VersionHistoryService
  ) { }

  ngOnInit(): void {
    this.text = this.sww.pronouncedWords;
    this.getSpeakers();
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.setStartHeight());
  }

  onEnter(event: Event) {
    event.preventDefault();
    let textArea = document.getElementById('bubble');
    textArea?.blur();
    if (this.text != this.sww.pronouncedWords) {
      this.save();
    }
  }

  setStartHeight() {
    let textAreas: HTMLCollectionOf<Element> = document.getElementsByClassName('chatBubble');
    for (let textArea of textAreas) {
      const height: number = textArea.scrollHeight + 0.01;
      this.renderer.setStyle(textArea, "height", height + 'px');
    }
  }

  onChanged(event: Event) {
    //console.log('Event: ' + event);
    this.selected = false;
    if (this.text == this.sww.pronouncedWords) {
      this.changed = false;
    } else {
      this.changed = true;
    }
  }

  onFocus() {
    this.audio.setStartEnd(this.sww.startTime, this.sww.endTime);
  }

  async onSelection(event: any) {
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;
    if (start != this.lastSelection[0] || end != this.lastSelection [1]) {
      this.lastSelection = [start, end];
      this.selection = this.speakerEdit.getStartEndFromSelection(this.sww, this.transcription, start, end);
      console.log('Result start: ' + this.selection[0] + ', end: ' + this.selection[1]);
      this.selected = true;
      await new Promise(r => setTimeout(r, 10));
      this.selectSpeaker(+this.sww.speakerLabel.split('_')[1]);
    }
  }

  getSpeakers() {
    for (let i = 0; i < this.recording.labels!.length; i++) {
      this.speakerList.push(
        new Speaker(
          this.recording.labels![i]!,
          i
        )
      );
    }
  }

  selectSpeaker(currentSpeaker: number) {
    this.selectedSpeaker = currentSpeaker;
    for (let speaker of this.speakerList) {
      const item = document.getElementById('speaker' + speaker.number);
      this.renderer.removeClass(item, 'chosenSpeaker');
      this.renderer.removeClass(item, 'speaker');
      if (speaker.number == currentSpeaker) {
        this.renderer.addClass(item, 'chosenSpeaker');
      } else {
        this.renderer.addClass(item, 'speaker');
      }
    }
  }

  async save() {
    await this.textEdit.saveTranscription(this.transcription, this.recording.id, this.sww, this.text);
    this.versionService.uploadVersion(this.recording.id, this.transcription, 'Edited Text');
    this.audio.resetState();
    this.changed = false;
  }

  cancel() {
    this.text = this.sww.pronouncedWords;
    this.audio.resetState();
    this.changed = false;
  }

  async speakerSave() {
    const newTranscription = this.speakerEdit.getNewSpeakerLabels(this.transcription, this.selection[0], this.selection[1], this.selectedSpeaker);
    const res = await this.transService.saveTranscription(newTranscription, this.recording.id);
    this.audio.resetState();
    this.speakerEdit.reloadTranscription(newTranscription);
  }

  async speakerCancel() {
    this.audio.resetState();
    this.selected = false;
    await new Promise(r => setTimeout(r, 10));
    this.lastSelection = [0, 0];
  }
}
