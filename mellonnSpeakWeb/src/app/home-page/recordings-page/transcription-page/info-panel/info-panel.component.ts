import { Component, Input, OnInit } from '@angular/core';
import { Recording } from 'src/models';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.scss']
})
export class InfoPanelComponent implements OnInit {

  @Input() recording: Recording;

  constructor() { }

  ngOnInit(): void {
  }

}
