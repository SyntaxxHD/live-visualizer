import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Property } from 'src/models/property.model';

@Component({
  selector: 'file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.sass']
})
export class FileComponent {
  @Input() config: Property;
  @Input() key: string;
  @Input() form: FormGroup;

  selectFile() {
    console.log('send message to main')
  }
}
