import { Component } from '@angular/core';
import { IpcRenderer } from 'electron'

declare const ipcRenderer: IpcRenderer;

@Component({
  selector: 'file-drop',
  templateUrl: './file-drop.component.html',
  styleUrls: ['./file-drop.component.sass']
})
export class FileDropComponent {
  onFileChange(file: any) {
    if (file[0]?.path) ipcRenderer.send('open-config', file[0]?.path)
  }
}
