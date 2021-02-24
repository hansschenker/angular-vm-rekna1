import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Item {
    id: number;
    name: string;
}
export interface ViewModel<T> {
    items: T[];
    addedItem?: T;
    selectedItem?: T;
  }

export type VmFn<T> = (vm: ViewModel<T>) => ViewModel<T>;

export interface DataService<Item> {
    httpHeaders: HttpHeaders;
    apiUrl: string;
    items$: Observable<Item[]>;
    item$(id: number): Observable<Item>;
    add$(item: Item): Observable<Item>;
    update$(item: Item): Observable<Item>;
    delete$(id: number): Observable<Item>;
}