import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

@Component({
  selector: 'selector',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.sass']
})
export class SelectComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;
}
