import { AfterViewInit, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { SpeakerWithWords } from '../transcription-service.service';

@Component({
  selector: 'app-user-chat-bubble',
  templateUrl: './user-chat-bubble.component.html',
  styleUrls: ['./user-chat-bubble.component.scss']
})
export class UserChatBubbleComponent implements AfterViewInit, OnInit {
  changed: boolean = false;
  text: string = '';

  @Input()
  sww!: SpeakerWithWords;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    this.text = this.sww.pronouncedWords;
      
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.setStartHeight());
  }

  setStartHeight(): void {
    let textAreas: HTMLCollectionOf<Element> = document.getElementsByClassName('userChatBubble');
    for (let textArea of textAreas) {
      const height: number = textArea.scrollHeight + 0.01;
      this.renderer.setStyle(textArea, "height", height + 'px');
    }
  }

  onChanged(event: Event): void {
    //let text: string = event.
    //console.log('The text was changed to: ' + text);
  }
}
