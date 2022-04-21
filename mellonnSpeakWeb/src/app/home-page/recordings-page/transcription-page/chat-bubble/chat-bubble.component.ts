import { Component, Input, Renderer2, AfterViewInit } from '@angular/core';
import { SpeakerWithWords } from '../transcription-service.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements AfterViewInit {
  @Input()
  sww!: SpeakerWithWords;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit(): void {
      this.setHeight();
  }

  setHeight(): void {
    let textAreas: HTMLCollectionOf<Element> = document.getElementsByClassName('chatBubble')
    for (let textArea of textAreas) {
      this.renderer.setStyle(textArea, "height", textArea!.scrollHeight + .1 + 'px');
    }
  }
}
