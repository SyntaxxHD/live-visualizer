import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.sass']
})
export class SliderComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;

  onValueLabelClick(event: MouseEvent): void {
    const label = event.target as HTMLLabelElement;
    label.contentEditable = 'true';
  }
  
  onValueLabelBlur(key: string, event: FocusEvent): void {
    if (!this.config.min) return
    if (!this.config.max) return

    const label = event.target as HTMLLabelElement;
    label.contentEditable = 'false';
    let newValue = parseFloat(label.innerText);
    if (newValue < this.config.min) newValue = this.config.min;
    if (newValue > this.config.max) newValue = this.config.max;
    this.form.controls[key].setValue(newValue);
  }
  
  onValueLabelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    }
  }
  
  onValueLabelKeypress(event: KeyboardEvent): void {
    if (event.key !== '.' && isNaN(parseInt(event.key))) {
      event.preventDefault();
    }
  }
}
