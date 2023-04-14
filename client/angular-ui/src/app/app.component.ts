import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PropertyMap } from '../models/property.model'
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'Live Visualizer';
  propertiesForm: FormGroup;

  properties: PropertyMap = {
    bloom_intensity: {
      max: 2,
      min: 0.1,
      step: 0.01,
      label: 'Bloom Intensity',
      type: 'slider',
      value: 0.8,
    },
    audio_responsive: {
      label: 'Audio Responsive',
      type: 'checkbox',
      value: true,
    },
    test: {
      label: 'Test',
      type: 'checkbox',
      value: true,
    },
    dye_resolution: {
      label: 'Dye Resolution',
      type: 'select',
      value: 512,
      options: [
        {
          label: 32,
          value: 32
        },
        {
          label: 64,
          value: 64
        },
        {
          label: 128,
          value: 128
        },
        {
          label: 256,
          value: 256
        },
        {
          label: 512,
          value: 512
        },
        {
          label: 1024,
          value: 1024
        },
        {
          label: 2048,
          value: 2048
        },
        {
          label: 4096,
          value: 4096
        }
      ],
    },
    background_color: {
      label: 'Background Color',
      type: 'color',
      value: "#34495e"
    },
    background_image: {
      label: 'Background Image',
      type: 'file',
      value: '',
      fileType: 'image'
    },
    text: {
      label: 'Text',
      type: 'text',
      value: ''
    },
    categoty: {
      label: 'Category',
      type: 'category',
      value: true,
      properties: {
        bloom_intensity2: {
          max: 2,
          min: 0.1,
          step: 0.01,
          label: 'Bloom Intensity',
          type: 'slider',
          value: 0.8,
        },
        audio_responsive2: {
          label: 'Audio Responsive',
          type: 'checkbox',
          value: true,
        },
      }
    }
  }

  constructor(private fb: FormBuilder) {
    this.propertiesForm = this.createForm();
    this.propertiesForm.valueChanges.subscribe(values => {
      console.log(values);
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

  isSliderProperty(property: any): property is {
    max: number;
    min: number;
    step: number;
    label: string;
    type: 'slider';
    value: number;
  } {
    return property.value.type === 'slider';
  }
}
