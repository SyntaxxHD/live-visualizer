import { Component } from '@angular/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { IpcRenderer } from 'electron';

declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.sass']
})
export class UpdateProgressDialogComponent {
  mode: ProgressBarMode = 'query'
  progress: number = 0

  ngOnInit(): void {
    ipcRenderer.on('ui.update.progress', (event: Event, percent: number) => {
      if (this.mode === 'query') this.mode = 'determinate'

      this.progress = percent
    })
  }
}
