import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { IpcRenderer } from 'electron';

declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.sass']
})
export class UpdateProgressDialogComponent {
  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}
  progress: number = 0
  mode: ProgressBarMode = 'query'

  ngOnInit(): void {
    ipcRenderer.send('ui.update.download.start')
    ipcRenderer.on('ui.update.progress', (event: Event, percent: number) => {
      if (this.mode === 'query') this.mode = 'determinate'
      this.progress = percent

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    })
  }
}
