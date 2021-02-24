import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, merge } from 'rxjs';
import { IPerson } from './types/types';
import { DataService } from './../shared/viewmodel';
import { Injectable } from '@angular/core';
import { catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PersonDataService implements DataService<IPerson> {
  apiUrl = "/api/persons/"
  httpHeaders = new HttpHeaders({'Content-Type':  'application/json'}); // , Authorization: 'my-auth-token'
  constructor(private http: HttpClient) { }
  // items list
  items$: Observable<IPerson[]> = this.http.get<IPerson[]>(this.apiUrl, {headers: this.httpHeaders})
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
  update1$(person: IPerson): Observable<IPerson> {
    return of()
  }
  // delete item
  delete$1(id: number): Observable<IPerson> {
    return of();
  }
  /** POST: add a new hero to the server */
addPerson(person: IPerson): Observable<IPerson> {
  return this.http.post<IPerson>(this.apiUrl, person, {headers: this.httpHeaders}).pipe(
    catchError(this.handleError)
    );
  }
  create$(person: IPerson): Observable<IPerson> {
    return this.http.post<IPerson>(this.apiUrl, person,  {headers: this.httpHeaders})
    .pipe(
      tap((newPerson: IPerson) => console.log(`added person w/ id=${newPerson.id}`)),
      catchError(this.errorHandler)
    )
  }  
  getById$(id: number): Observable<IPerson> {
    return this.http.get<IPerson>(this.apiUrl + id)
    .pipe(
      catchError(this.errorHandler)
    )
  }

  getAll$: Observable<IPerson[]>  = this.http.get<IPerson[]>(this.apiUrl)
    .pipe(
      catchError(this.errorHandler)
    )
  

  update$(person: IPerson): Observable<IPerson> {
    return this.http.put<IPerson>(this.apiUrl + person.id, person,  {headers: this.httpHeaders})
    .pipe(
      catchError(this.errorHandler)
    )
  }

  delete$(id: number): Observable<IPerson>{
    return this.http.delete<IPerson>(this.apiUrl + id, {headers: this.httpHeaders})
    .pipe(
      //tap( p => console.log("server-deleted:", id)),
      catchError(this.errorHandler)
    )
  }


  
  
  

  errorHandler(error) {
     let errorMessage = '';
     if(error.error instanceof ErrorEvent) {
       // Get client-side error
       errorMessage = error.error.message;
     } else {
       // Get server-side error
       errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
     }
     console.log(errorMessage);
     return throwError(errorMessage);
  }
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
