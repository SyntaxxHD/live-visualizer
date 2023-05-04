import { Component } from '@angular/core';
import { IpcRenderer } from 'electron';

declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'app-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.sass']
})
export class UpdateFinishDialogComponent {
  installUpdate(): void {
    ipcRenderer.send('ui.update.install')
  }
}
