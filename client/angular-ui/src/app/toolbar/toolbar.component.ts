import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../dialogs/settings/settings.component';
import { AudioSource } from 'src/models/audiosource.model';
import { IpcRenderer } from 'electron';

declare const ipcRenderer: IpcRenderer;

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.sass']
})
export class ToolbarComponent {
  constructor(public dialog: MatDialog) {}

  audioSources: Array<AudioSource> = [
    {
      label: 'Desktop Audio',
      value: 'desktop',
      unavailable: ipcRenderer.sendSync('all.platform.mac')
    }
  ]

  ngOnInit(): void {
    this.getAudioSources()
  }

  openSettingsDialog(): void {
    this.dialog.open(SettingsDialogComponent, {
      width: '400px',
      data: this.audioSources
    })
  }

  getAudioSources(): void {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      devices.forEach(device => {
        if (device.kind !== 'audioinput') return
        this.audioSources.push({
          label: device.label,
          value: device.deviceId
        })
      })
    })
  }
}
