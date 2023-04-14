interface Options {
  label: any;
  value: any;
}

export type PropertyType = 'slider' | 'checkbox' | 'select' | 'color' | 'file' | 'text' | 'category';

export type FileType = 'image' | 'video';

export interface Property {
  label: string;
  type: PropertyType;
  value: any
  max?: number;
  min?: number;
  step?: number;
  options?: Array<Options>;
  properties?: PropertyMap;
  fileType?: FileType;
}

export type PropertyMap = { [key: string]: Property };
