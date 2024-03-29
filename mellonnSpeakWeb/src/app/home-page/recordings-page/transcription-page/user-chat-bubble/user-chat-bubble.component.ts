import { AfterViewInit, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { TextEditService } from 'src/app/shared/text-edit-service/text-edit.service';
import { AudioService } from '../services/audio.service';
import { Transcription } from '../transcription';
import { Speaker, SpeakerWithWords, TranscriptionService } from '../services/transcription-service.service';
import { SpeakerEditService } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
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

    /**
     * Keeps the text selected when a user selects another speaker
     */
    window.addEventListener("click", (e) => {
      const ele = <Element>e.target;
      if ((ele.id.includes("speaker") || ele.classList.contains("text"))&& this.selected) {
        const textarea = <HTMLInputElement>document.getElementById(this.sww.startTime.toString());
        textarea.focus();
        textarea.setSelectionRange(this.lastSelection[0], this.lastSelection[1]);
      }
    });

    window.addEventListener("dblclick", (e) => {
      const ele = <Element>e.target;
      if ((!ele.id.includes("speaker") || !ele.classList.contains("text")) && this.selected) {
        this.cancel();
      }
    });
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.setStartHeight());
  }

  onEnter(event: Event) {
    event.preventDefault();
    let textArea = document.getElementById('bubble');
    if (this.text != this.sww.pronouncedWords) {
      this.save();
    }
    textArea?.blur();
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
      console.log(this.selection);
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
    let both: boolean = this.changed && this.selected;
    if (this.changed) {
      newTranscription = await this.textSave(newTranscription);
      versionText = 'Edited Text';
    }
    if (this.selected) {
      newTranscription = await this.speakerSave(newTranscription);
      versionText = 'Edited Speaker';
    }
    if (both) versionText = 'Edited Text and Speaker';
    this.transService.setTranscription(newTranscription);
    await this.versionService.uploadVersion(this.transService.recording.id, newTranscription!, versionText);
    await this.transService.saveTranscription(newTranscription, this.transService.recording.id);
  }

  async cancel() {
    this.text = this.sww.pronouncedWords;
    this.audio.resetState();
    this.changed = false;
    this.selected = false;
    await new Promise(r => setTimeout(r, 10));
    const textarea = <HTMLInputElement>document.getElementById(this.sww.startTime.toString());
    textarea.focus();
    textarea.setSelectionRange(0, 0);
    textarea.blur();
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
