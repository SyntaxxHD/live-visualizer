import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Config, PropertyMap } from '../models/property.model'
import { IpcRenderer } from 'electron';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UnlinkDialogComponent } from './dialogs/unlink/unlink.component';
import { UpdateNotificationDialogComponent } from './dialogs/update/notification/notification.component';

declare const ipcRenderer: IpcRenderer;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title: string;
  propertiesForm: FormGroup;
  properties: PropertyMap = {};
  propertiesLoaded = false;
  blockInputChanges = false;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private fb: FormBuilder, private snackBar: MatSnackBar, public dialog: MatDialog) { }

  ngOnInit() {
    ipcRenderer.on('ui.properties.change.output', (event: Event, data: Config) => {
      this.blockInputChanges = true;
      this.title = data.title;
      this.properties = data.properties;
      this.propertiesForm = this.createForm();
      this.propertiesLoaded = true;

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });

      this.propertiesForm.valueChanges.subscribe(values => {
        ipcRenderer.send('ui.properties.change.input', values)
      })
    })

    ipcRenderer.on('ui.errors.message', (event: Event, error: Error) => {
      this.displayError(error)
    })

    ipcRenderer.on('ui.properties.unlink', (event: Event) => {
      this.properties = {};
      this.propertiesLoaded = false;
      this.dialog.open(UnlinkDialogComponent)

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    })

    ipcRenderer.on('ui.update.available', (event: Event) => {
      this.dialog.open(UpdateNotificationDialogComponent)
    })
  }

  createForm(): FormGroup {
    const formGroup = this.fb.group({});
    const controlTypes = ['slider', 'checkbox', 'select', 'color', 'file', 'text'];

    const addControl = (name: string, value: any) => {
      formGroup.addControl(name, this.fb.control(value));
    };

    const createControls = (properties: any) => {
      for (const [name, prop] of Object.entries(properties)) {
        const typedProp = prop as { type: string, value: any, properties?: any };
        if (controlTypes.includes(typedProp.type)) {
          addControl(name, typedProp.value);
        } 
        else if (typedProp.type === 'category' && typedProp.properties) {
          addControl(name, typedProp.value);
          createControls(typedProp.properties);
        } 
        else {
          console.error(`Unsupported property type: ${typedProp.type}`);
        }
      }
    };

    createControls(this.properties);
    return formGroup;
  }
  
  displayError(error: Error): void {
    console.error(error)
    this.ngZone.run(() => {
      this.snackBar.open(error.message, 'OK', {
        panelClass: ['red-snackbar']
      })
    })
  }
}
