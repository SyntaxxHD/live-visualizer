import { Directive, HostListener, HostBinding, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[fileDragDrop]'
})

export class FileDragNDropDirective {
  @Output() private filesChangeEmiter : EventEmitter<File[]> = new EventEmitter();
  @HostBinding('style.border-style') private borderStyle = '2px dashed';

  constructor() { }

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.borderStyle = 'solid'
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();
    this.borderStyle = 'dashed'
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent){
    evt.preventDefault();
    evt.stopPropagation();

    const files = evt.dataTransfer?.files;
    const validFiles: Array<File> = files ? Array.from(files) : [];
    this.filesChangeEmiter.emit(validFiles);

    this.borderStyle = 'dashed';
  }
}