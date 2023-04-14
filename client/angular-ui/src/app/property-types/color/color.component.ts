import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

const defaultPalette = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];

@Component({
  selector: 'color',
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.sass']
})
export class ColorComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;

  palette: string[] = this.getPaletteFromLocalStorage() || defaultPalette;

  ngOnInit(): void {
    this.form.controls[this.key].valueChanges.subscribe(value => {
      const newColor = value;  
      const shiftedPalette = this.palette.slice(1);
      shiftedPalette.push(newColor);
      this.palette = shiftedPalette;
      localStorage.setItem('palette', JSON.stringify(this.palette));
    })
  }

  private getPaletteFromLocalStorage(): string[] | null {
    const paletteJson = localStorage.getItem('palette');
    if (paletteJson !== null) {
      try {
        const parsedPalette = JSON.parse(paletteJson);
        if (Array.isArray(parsedPalette) && parsedPalette.length === 4) {
          return parsedPalette;
        }
      } catch (error) {}
    }
    return null;
  }

}
