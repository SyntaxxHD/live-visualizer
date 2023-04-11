interface Options {
  label: any;
  value: any;
}

export interface Property {
  label: string;
  type: 'slider' | 'checkbox' | 'select' | 'color';
  value: any
  max?: number;
  min?: number;
  step?: number;
  options?: Array<Options>;
}

export type PropertyMap = { [key: string]: Property };
