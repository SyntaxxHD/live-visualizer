import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IpcRenderer } from 'electron';
import { Property } from 'src/models/property.model';

const defaultPalette = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];
declare const ipcRenderer: IpcRenderer

@Component({
  selector: 'color',
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.sass']
})
export class ColorComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;

  palette: string[] = ipcRenderer.sendSync('ui.colors.palette.get') || defaultPalette;

  ngOnInit(): void {
    this.form.controls[this.key].valueChanges.subscribe(value => {
      const newColor = value;  
      const shiftedPalette = this.palette.slice(1);
      shiftedPalette.push(newColor);
      this.palette = shiftedPalette;
      localStorage.setItem('palette', JSON.stringify(this.palette));
      ipcRenderer.send('ui.colors.palette.set', this.palette)
    })
  }
}