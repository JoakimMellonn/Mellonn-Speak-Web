import { Component, Input, Renderer2, AfterViewInit } from '@angular/core';
import { TextEditService } from 'src/app/shared/text-edit.service';
import { AudioService } from '../audio.service';
import { Transcription } from '../transcription';
import { SpeakerWithWords } from '../transcription-service.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements AfterViewInit {
  changed: boolean = false;
  text: string = '';

  @Input() sww!: SpeakerWithWords;
  @Input() isUser!: boolean;
  @Input() transcription!: Transcription;
  @Input() id!: string;

  constructor(private renderer: Renderer2, private textEdit: TextEditService, private audio: AudioService) { }

  ngOnInit(): void {
    this.text = this.sww.pronouncedWords;
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
    if (this.text == this.sww.pronouncedWords) {
      this.changed = false;
    } else {
      this.changed = true;
    }
  }

  onFocus() {
    this.audio.setStartEnd(this.sww.startTime, this.sww.endTime);
  }

  async save() {
    await this.textEdit.saveTranscription(this.transcription, this.id, this.sww, this.text);
    this.changed = false;
  }

  cancel() {
    this.text = this.sww.pronouncedWords;
    this.changed = false;
  }
}
