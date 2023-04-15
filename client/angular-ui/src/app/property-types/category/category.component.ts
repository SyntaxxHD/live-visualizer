import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.sass']
})
export class CategoryComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;
}
