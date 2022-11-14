import { Component, Input, Renderer2, AfterViewInit } from '@angular/core';
import { TextEditService } from 'src/app/shared/text-edit-service/text-edit.service';
import { AudioService } from '../services/audio.service';
import { Transcription } from '../transcription';
import { Speaker, SpeakerWithWords, TranscriptionService } from '../services/transcription-service.service';
import { SpeakerEditService } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
import { Recording } from 'src/models';
import { VersionHistoryService } from '../version-history/version-history.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements AfterViewInit {
  changed: boolean = false;
  selected: boolean = false;
  text: string = '';
  speakerList: Speaker[] = [];
  selectedSpeaker: number = 0;
  selection: number[] = [];
  lastSelection: number[] = [0, 0];

  @Input() sww!: SpeakerWithWords;
  @Input() isUser!: boolean;

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
      this.selection = this.speakerEdit.getStartEndFromSelection(this.sww, this.transService.transcription, start, end);
      this.selected = true;
      await new Promise(r => setTimeout(r, 10));
      this.selectSpeaker(+this.sww.speakerLabel.split('_')[1]);
    }
  }

  getSpeakers() {
    for (let i = 0; i < this.transService.recording.labels!.length; i++) {
      this.speakerList.push(
        new Speaker(
          this.transService.recording.labels![i]!,
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
    let newTranscription: Transcription = this.transService.transcription;
    let versionText: string = '';
    if (this.changed) {
      newTranscription = await this.textSave(newTranscription);
      versionText = 'Edited Text';
    }
    if (this.selected) {
      newTranscription = await this.speakerSave(newTranscription);
      versionText = 'Edited Speaker';
    }
    if (this.changed && this.selected) versionText = 'Edited Text and Speaker';
    this.transService.setTranscription(newTranscription);
    await this.versionService.uploadVersion(this.transService.recording.id, newTranscription!, versionText);
    await this.transService.saveTranscription(newTranscription, this.transService.recording.id);
  }

  async cancel() {
    this.text = this.sww.pronouncedWords;
    this.changed = false;
    this.selected = false;
    await new Promise(r => setTimeout(r, 10));
    this.lastSelection = [0, 0];
  }

  async textSave(t: Transcription): Promise<Transcription> {
    const newTranscription = await this.textEdit.createNewTranscription(this.transService.transcription, this.sww, this.text);
    this.changed = false;
    return newTranscription;
  }

  async speakerSave(t: Transcription): Promise<Transcription> {
    const newTranscription = this.speakerEdit.getNewSpeakerLabels(this.transService.transcription, this.selection[0], this.selection[1], this.selectedSpeaker);
    this.speakerEdit.reloadTranscription(newTranscription);
    this.selected = false;
    return newTranscription;
  }
}
