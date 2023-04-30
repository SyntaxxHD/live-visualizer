import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { MaterialExampleModule } from '../material.module';
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
    UnlinkDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxMatColorPickerModule,
    MaterialExampleModule,
    ReactiveFormsModule,
    FormsModule,
    NgxColorsModule
  ],
  providers: [
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
