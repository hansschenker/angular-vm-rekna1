import { HttpClient } from '@angular/common/http';
import { PersonService } from './person.service';
import { Component, OnInit } from '@angular/core';
// rxjs
import { Observable, Subject, merge } from 'rxjs';
import { map, scan, mergeMap, startWith, tap } from 'rxjs/operators';
// persons
import { ViewModel, VmFn } from './../shared/viewmodel';
import {IPerson  } from "./types/types";

// interface IUser {
//   id?:number;
//   name:string;
// }
// interface IViewModel {
//   users: IUser[];
//   selectedUser?: IUser;
// }


// interface PersonVm extends ViewModel<IPerson> {
//   items: IPerson[];
//   selectedItem?: IPerson;
// }
interface PersonVm extends ViewModel<IPerson> {
  persons: IPerson[];
  selectedPerson?: IPerson;
}

 //type PersonVmFn = VmFn<IPerson>;
 type PersonVmFn = (vm: PersonVm) => PersonVm;

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss']
})
export class PersonsComponent {


//public personDetailState = new Subject<IPerson>();
// public vm$ : Observable<IPersonVm>;
  // define observable vm
  // ------------ users -----------------------------------------
  public vm$ : Observable<PersonVm>;
  // create action streams
  public addState = new Subject<Partial<IPerson>>();
  public deleteState = new Subject<IPerson>();
  public detailState = new Subject<IPerson>();
  public detailStateClose = new Subject();
  // ------------------ users .---------------------------------

constructor(private svc:PersonService, private http: HttpClient) {


  // ------------------- users ---------------------------


    // merge action streams into one
    // and track state with the help of scan operator
    this.vm$ = merge(
      this.getItemsState,
      this.addChange$,
      this.deleteChange$,
      this.detailChange$,
      this.detailCloseChange$
    ).pipe(
      scan( (oldVm:PersonVm, mutateFn:PersonVmFn) => mutateFn(oldVm), {persons:[]} as PersonVm )
    );
  
} // constructor

// -------------- persons --------------------------------
private getItemsState = this.svc.getPersons$.pipe(
  map( persons => ( vm: PersonVm) => ({ ...vm, persons }) )
)

private addChange$ = this.addState.pipe(
  // tap(p => console.log("add person:", p)),
  map( 
    person => (vm:PersonVm) => ({...vm, persons: [...vm.persons , person ] })
    ),
)
private deleteChange$ = this.deleteState.pipe(
  map( item => (vm:PersonVm) => ({...vm, persons: vm.persons.filter(p => p.id !==item.id) }))
)

private detailChange$ = this.detailState.pipe(
  map( selectedPerson => (vm:PersonVm) => ({...vm, selectedPerson }))
)
private detailCloseChange$ = this.detailStateClose.pipe(
  map( _ => (vm:PersonVm) => ({...vm, selectedPerson:null }))
)
// ----------------- users -------------------------------

} // class

