import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PropertyMap } from '../models/property.model'
import { IpcRenderer } from 'electron';

declare const ipcRenderer: IpcRenderer;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'Live Visualizer';
  propertiesForm: FormGroup;
  properties: PropertyMap = {};
  propertiesLoaded = false;

  constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder) {}

  ngOnInit() {
    ipcRenderer.on('ui-properties-update', (event, data) => {
      this.properties = data;
      this.propertiesForm = this.createForm();
      this.propertiesLoaded = true;
      console.log(this.properties);
      this.cdr.detectChanges();
    })
  }

  createForm(): FormGroup {
    const formGroup = this.fb.group({});
    for (const [name, prop] of Object.entries(this.properties)) {
      switch (prop.type) {
        case 'slider':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'checkbox':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'select':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'color':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'file':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'text':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        case 'category':
          formGroup.addControl(name, this.fb.control(prop.value));

          if (prop.properties) {
            for (const [categoryName, categoryProp] of Object.entries(prop.properties)) {
              switch (categoryProp.type) {
                case 'slider':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                case 'checkbox':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                case 'select':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                case 'color':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                case 'file':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                case 'text':
                  formGroup.addControl(categoryName, this.fb.control(categoryProp.value));
                  break;
                default:
                  console.error(`Unsupported property type: ${categoryProp.type}`);
              }
            }
          }
          break;
        default:
          console.error(`Unsupported property type: ${prop.type}`);
      }
    }
    return formGroup;
  }
}
