import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appDnd]'
})
export class DndDirective {
  @HostBinding('class.fileOver') fileOver: boolean;
  @Output() fileDropped = new EventEmitter<File>();

  constructor() { }

  @HostListener('dragover', ['$event']) onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.fileOver = false;
  }

  @HostListener('drop', ['$event']) public onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('drop');
    this.fileOver = false;
    const files = event.dataTransfer!.files;
    
    if (files.length == 1) {
      this.fileDropped.emit(files[0]);
    } else if (files.length > 1) {
      alert('You can only upload one file at the time...');
    }
  }
}
