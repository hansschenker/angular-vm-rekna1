import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { IPerson } from './types/types';
import { DataService } from './../shared/viewmodel';
import { Injectable } from '@angular/core';
import { catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PersonDataService implements DataService<IPerson> {
  itemsUrl = "/api/persons"
  httpHeaders = new HttpHeaders({'Content-Type':  'application/json'}); // , Authorization: 'my-auth-token'
  // items list
  items$: Observable<IPerson[]> = this.http.get<IPerson[]>(this.itemsUrl, {headers: this.httpHeaders})
  .pipe(
    tap(response => console.log(JSON.stringify(response))),
    shareReplay(1),
    catchError(this.handleError)
  );
  // item
  item$(id: number): Observable<IPerson> {
    return of();
  }
  // add item
  add$(person: IPerson): Observable<IPerson> {
    return of()
  }
  // update item
  update$(person: IPerson): Observable<IPerson> {
    return of()
  }
  // delete item
  delete$(id: number): Observable<IPerson> {
    return of();
  }

  constructor(private http: HttpClient) { }
      // handle errors method
      private handleError(err: any) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        let errorMessage: string;
        if (err.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          errorMessage = `An error occurred: ${err.error.message}`;
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
        }
        console.error(err);
        return throwError(errorMessage);
      }
}
