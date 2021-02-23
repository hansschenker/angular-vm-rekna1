export interface ViewModel<T> {
    items: T[];
    selectedItem?: T;
  }

export type VmFn<T> = (vm: ViewModel<T>) => ViewModel<T>;