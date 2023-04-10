export interface Property {
  label: string;
  type: 'slider' | 'checkbox';
  value: number | boolean;
  max?: number;
  min?: number;
  step?: number;
}

export type PropertyMap = { [key: string]: Property };
