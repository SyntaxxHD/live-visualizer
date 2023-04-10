import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'Live Visualizer';
  propertiesForm: FormGroup;
  
  properties = {
    bloom_intensity: {
      fraction: true,
      max: 2,
      min: 0.1,
      precision: 2,
      step: 0.01,
      label: 'Bloom Intensity',
      type: 'slider',
      value: 0.8,
    },
    audio_responsive: {
      label: 'Audio Responsive',
      type: 'checkbox',
      value: true,
    }
  }

  // formArray = []

  // ngOnInit() {
  //   let formProperties: string[] = Object.keys(this.properties);

  //   let i = 0;
  //   for (let prop of formProperties ) { 
  //       this.formArray.push(formProperties[prop]);
  //       this.formArray[i].['name'] = prop;
  //       i++;
  //   }
  // }

  constructor(private fb: FormBuilder) {
    this.propertiesForm = this.createForm();
  }

  createForm(): FormGroup {
    const formGroup = this.fb.group({});
    for (const [name, prop] of Object.entries(this.properties)) {
      switch (prop.type) {
        case 'slider':
          formGroup.addControl(name, this.fb.control(prop.value));
          break;
        default:
          console.error(`Unsupported property type: ${prop.type}`);
      }
    }
    return formGroup;
  }
}
