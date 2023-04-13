import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

@Component({
  selector: 'color',
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.sass']
})
export class ColorComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;
}
