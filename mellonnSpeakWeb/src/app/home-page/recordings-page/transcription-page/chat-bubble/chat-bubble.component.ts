import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { SpeakerWithWords } from '../transcription-service.service';

@Component({
  selector: 'app-chat-bubble',
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements OnInit {
  boxHeight: number;

  @Input()
  sww!: SpeakerWithWords;

  constructor(private element: ElementRef) { }

  ngOnInit(): void {
    this.setHeight();
  }

  setHeight(): void {
    const textArea = this.element.nativeElement.querySelector('.chatBubble');
    textArea.style.height = '100px';
    //textArea.style.height = textArea.scrollHeight + 'px';
  }
}
