import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IpcRenderer } from 'electron';
import { AudioSource } from 'src/models/audiosource.model';

declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder) { }

  settingsForm: FormGroup
  audioSources: Array<AudioSource> = this.data
  selectedSource: string = ipcRenderer.sendSync('all.settings.audiosource.get')

  get audioSource(): FormControl<string> {
    return this.settingsForm.get('audioSource') as UntypedFormControl;
  }

  ngOnInit(): void {
    this.settingsForm = this.fb.group({
      audioSource: [this.selectedSource]
    })

    this.getAudioSources()
    this.settingsForm.valueChanges.subscribe(value => {
      ipcRenderer.send('ui.settings.audiosource.set', value.audioSource)
    })
  }

  getAudioSources(): void {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      console.log(this.audioSources.find(source => source.value === 'desktop'))
      this.audioSources = [this.audioSources.find(source => source.value === 'desktop') ?? { label: '', value: '' }]
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
