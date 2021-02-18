import { HttpClient } from '@angular/common/http';
import { PersonService } from './person.service';
import { Component, OnInit } from '@angular/core';
// rxjs
import { Observable, Subject, merge } from 'rxjs';
import { map, scan, mergeMap, startWith } from 'rxjs/operators';
// persons
import {IPerson, IPersonDetail, IPersonVm } from "./types/types";

interface IUser {
  id?:number;
  name:string;
}
interface IViewModel {
  users: IUser[];
  selectedUser?: IUser;
}

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss']
})
export class PersonsComponent {


public personDetailSubj = new Subject<IPerson>();
// public vm$ : Observable<IPersonVm>;
  // define observable vm
  // ------------ users -----------------------------------------
  public vm$ : Observable<IViewModel>;
  // create action streams
  public addUserState = new Subject<IUser>();
  public deleteUserSubj = new Subject<IUser>();
  public detailUserSubj = new Subject<IUser>();
  public closeDetailSubj = new Subject();
  // ------------------ users .---------------------------------

constructor(private personService:PersonService, private http: HttpClient) {
  // ------------------- users ---------------------------


    // merge action streams into one
    // and track state with the help of scan operator
    this.vm$ = merge(
      this.getUserAction$,
      this.addUserChange,
      this.deleteUserAction$,
      this.detailUserAction$,
      this.closeDetailAction$
    ).pipe(
      scan( (oldVm:IViewModel, mutateFn:(vm:IViewModel)=>IViewModel) => mutateFn(oldVm), {users:[]} as IViewModel )
    );


  // -------------------------users -----------------------
  // retrieving list of persons (could be a http request)

  // select a person, get detail and set it on viewmodel
  const personDetail$ = this.personDetailSubj.pipe(
    startWith({id: 1, name:"test", age: 42, height: 180, weight: 80, bmi: 0}),
    mergeMap( person => this.personService.getPersonDetail(person.id) ),
    map( personDetail => (vm:IPersonVm) => ({...vm, personDetail }))
  );
  const personList$ = this.personService.getAllPersons().pipe(
    map( persons => (vm:IPersonVm) => ({...vm, persons}) )
  );
  
  // in this example the initial viewmodel state is provided with the second 
  // parameter of the scan function. Alternatively one could provide an initial 
  // state with the rxjs of function 
  const vm$ = merge(personList$, personDetail$).pipe(
    scan( (vm:IPersonVm, mutationFn:(vm:IPersonVm)=>IPersonVm) => mutationFn(vm), {persons:[], personDetail:null}
    )
  )
  
} // constructor

// -------------- users --------------------------------
private getUserAction$ = this.http.get<IUser[]>(`https://jsonplaceholder.typicode.com/users`).pipe(
  map( users => (vm:IViewModel) => ({...vm, users}))

);

private addUserChange = this.addUserState.pipe(
  map( user => (vm:IViewModel) => ({...vm, users: [...vm.users ,{id:9, name:user}] })),
)
private deleteUserAction$ = this.deleteUserSubj.pipe(
  map( user => (vm:IViewModel) => ({...vm, users: vm.users.filter(u=>u!==user) }))
)

private detailUserAction$ = this.detailUserSubj.pipe(
  map( selectedUser => (vm:IViewModel) => ({...vm, selectedUser }))
)
private closeDetailAction$ = this.closeDetailSubj.pipe(
  map( _ => (vm:IViewModel) => ({...vm, selectedUser:null }))
)
// ----------------- users -------------------------------

} // class

