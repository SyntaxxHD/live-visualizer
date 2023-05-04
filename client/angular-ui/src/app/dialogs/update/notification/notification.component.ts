import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IpcRenderer } from 'electron';
import { UpdateErrorDialogComponent } from '../error/error.component';
import { UpdateFinishDialogComponent } from '../finish/finish.component';
import { UpdateProgressDialogComponent } from '../progress/progress.component';

declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.sass']
})
export class UpdateNotificationDialogComponent {
  constructor(public dialog: MatDialog) {}
  
  downloadUpdate(): void {
    const dialogRef = this.dialog.open(UpdateProgressDialogComponent, {
      disableClose: true
    })
    
    ipcRenderer.send('ui.update.download.start')

    ipcRenderer.on('ui.update.download.stop', (event: Event) => {
      dialogRef.close()
    })
    
    ipcRenderer.on('ui.update.error', (event: Event) => {
      dialogRef.close()
      this.dialog.open(UpdateErrorDialogComponent)
    })

    ipcRenderer.on('ui.update.finish', (event: Event) => {
      dialogRef.close()
      this.dialog.open(UpdateFinishDialogComponent)
    })
  }
}
