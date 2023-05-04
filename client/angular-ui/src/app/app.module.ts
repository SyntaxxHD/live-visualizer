import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxColorsModule } from 'ngx-colors';
import { SliderComponent } from './property-types/slider/slider.component';
import { CheckboxComponent } from './property-types/checkbox/checkbox.component';
import { SelectComponent } from './property-types/select/select.component';
import { ColorComponent } from './property-types/color/color.component';
import { FileComponent } from './property-types/file/file.component';
import { TextComponent } from './property-types/text/text.component';
import { CategoryComponent } from './property-types/category/category.component';
import { FileDropComponent } from './file-drop/file-drop.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { FileDragNDropDirective } from './file-drop/file-drag-n-drop.directive';
import { UnlinkDialogComponent } from './dialogs/unlink/unlink.component';
import { SettingsDialogComponent } from './dialogs/settings/settings.component';
import { UpdateNotificationDialogComponent } from './dialogs/update/notification/notification.component';
import { UpdateFinishDialogComponent } from './dialogs/update/finish/finish.component';
import { UpdateErrorDialogComponent } from './dialogs/update/error/error.component';
import { UpdateProgressDialogComponent } from './dialogs/update/progress/progress.component';

import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialogModule} from '@angular/material/dialog';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatToolbarModule} from '@angular/material/toolbar';
import {DialogModule} from '@angular/cdk/dialog';

@NgModule({
  declarations: [
    AppComponent,
    SliderComponent,
    CheckboxComponent,
    SelectComponent,
    ColorComponent,
    FileComponent,
    TextComponent,
    CategoryComponent,
    FileDropComponent,
    ToolbarComponent,
    FileDragNDropDirective,
    UnlinkDialogComponent,
    SettingsDialogComponent,
    UpdateNotificationDialogComponent,
    UpdateFinishDialogComponent,
    UpdateErrorDialogComponent,
    UpdateProgressDialogComponent,
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    NgxColorsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSliderModule,
    MatSnackBarModule,
    MatToolbarModule,
    DialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
