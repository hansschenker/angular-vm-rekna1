import { Item } from './../shared/viewmodel';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, shareReplay, switchMap, tap, map } from 'rxjs/operators';
import { IPerson } from './types/types';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private personsUrl = "/api/persons"
  httpHeaders = new HttpHeaders({'Content-Type':  'application/json'}); // , Authorization: 'my-auth-token'
  
  constructor(private http: HttpClient) { }

  // List of persons ---------------------------------------------------------------------------
  getPersons$: Observable<IPerson[]> = this.http.get<IPerson[]>(this.personsUrl, {headers: this.httpHeaders})
    .pipe(
      tap(response => console.log(JSON.stringify(response))),
      shareReplay(1),
      catchError(this.handleError)
    );
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
    // generic version getItems
      // List of persons ---------------------------------------------------------------------------
  getItems$: Observable<IPerson[]> = this.http.get<IPerson[]>(this.personsUrl, {headers: this.httpHeaders})
  .pipe(
    tap(response => console.log(JSON.stringify(response))),
    shareReplay(1),
    catchError(this.handleError)
  );


    getAllPersons(): Observable<IPerson[]> {
      return this.http.get<IPerson[]>(this.personsUrl, {headers: this.httpHeaders})
      .pipe(
        tap(response => console.log(JSON.stringify(response))),
        shareReplay(1),
        catchError(this.handleError)
      );
    }
    // get selected person -------------------------------------------------------------------------
    // rekna 
    getPersonDetail(id: number): Observable<IPerson> {

      return this.http.get<IPerson>(this.personsUrl, {headers: this.httpHeaders})
      .pipe(
        tap(response => console.log(JSON.stringify(response))),
        shareReplay(1),
        catchError(this.handleError)
      );
    }
    // deborah product selection action
  private personSelectedState = new BehaviorSubject<number>(0);
  personSelectedAction$ = this.personSelectedState.asObservable();

  person$ = this.personSelectedAction$
    .pipe(
      filter(id => !!id),
      switchMap(selectedProductId =>
        this.http.get<IPerson>(`${this.personsUrl}/${selectedProductId}`)
          .pipe(
            tap(response => console.log(JSON.stringify(response))),
            map(p => ({ ...p, bmi: p.weight / p.height * p.height }) as IPerson),
            catchError(this.handleError)
          )
      ));
} // class
