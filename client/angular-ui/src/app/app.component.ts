import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
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

  constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder, private ngZone: NgZone) { }

  ngOnInit() {
    ipcRenderer.on('ui-properties-update', (event, data) => {
      this.properties = data;
      this.propertiesForm = this.createForm();
      //this.propertiesLoaded = true;
      console.log(this.propertiesForm)
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });

      this.propertiesForm.valueChanges.subscribe(values => {
        console.log(values);
        //ipcRenderer.send('ui-properties-change', values)
      })
    })
  }

  // createForm(): FormGroup {
  //   const formGroup = this.fb.group({});
  //   const controlTypes = ['slider', 'checkbox', 'select', 'color', 'file', 'text'];

  //   const addControl = (name: string, value: any) => {
  //     formGroup.addControl(name, this.fb.control(value));
  //   };

  //   const createControls = (properties: any) => {
  //     for (const [name, prop] of Object.entries(properties)) {
  //       const typedProp = prop as { type: string, value: any, properties?: any };
  //       if (controlTypes.includes(typedProp.type)) {
  //         addControl(name, typedProp.value);
  //       } 
  //       else if (typedProp.type === 'category' && typedProp.properties) {
  //         addControl(name, typedProp.value);
  //         createControls(typedProp.properties);
  //       } 
  //       else {
  //         console.error(`Unsupported property type: ${typedProp.type}`);
  //       }
  //     }
  //   };

  //   createControls(this.properties);
  //   return formGroup;
  // }
  createForm(): FormGroup {
    const formGroup = this.fb.group({});
    const controlTypes = ['slider', 'checkbox', 'select', 'color', 'file', 'text'];
  
    const createControl = (name: string, value: any) => {
      formGroup.addControl(name, this.fb.control(value));
    };
  
    const createFormGroup = (properties: any, key: string) => {
      const formGroup = this.fb.group({});
      for (const [name, prop] of Object.entries(properties)) {
        const typedProp = prop as { type: string, value: any, properties?: any };
        if (controlTypes.includes(typedProp.type)) {
          createControl(name, typedProp.value);
        } else if (typedProp.type === 'category' && typedProp.properties) {
          createControl(name, typedProp.value);
          formGroup.addControl(name, createFormGroup(typedProp.properties, name));
        } else {
          console.error(`Unsupported property type: ${typedProp.type}`);
        }
      }
      return formGroup;
    };
  
    const createControls = (properties: any) => {
      for (const [name, prop] of Object.entries(properties)) {
        const typedProp = prop as { type: string, value: any, properties?: any };
        if (controlTypes.includes(typedProp.type)) {
          createControl(name, typedProp.value);
        } else if (typedProp.type === 'category' && typedProp.properties) {
          createControl(name, typedProp.value);
          formGroup.addControl(name, createFormGroup(typedProp.properties, name));
        } else {
          console.error(`Unsupported property type: ${typedProp.type}`);
        }
      }
    };
  
    createControls(this.properties);
    return formGroup;
  }
  
}
