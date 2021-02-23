import { HttpClient } from '@angular/common/http';
import { PersonService } from './person.service';
import { Component, OnInit } from '@angular/core';
// rxjs
import { Observable, Subject, merge } from 'rxjs';
import { map, scan, mergeMap, startWith, tap } from 'rxjs/operators';
// persons
import { ViewModel, VmFn } from './../shared/viewmodel';
import {IPerson  } from "./types/types";

interface PersonVm extends ViewModel<IPerson> {
  persons: IPerson[];
  selectedPerson?: IPerson;
}

 type PersonVmFn = (vm: PersonVm) => PersonVm;

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss']
})
export class PersonsComponent {


  // vm$ : public viewmodel merge all changes$ into viewmodel
  public vm$ : Observable<PersonVm>;
  // create user action state streams: crudl (create, read, update, delete, list)
  public addState = new Subject<Partial<IPerson>>();
  public updateState = new Subject<Partial<IPerson>>();
  public deleteState = new Subject<IPerson>();
  public detailState = new Subject<IPerson>();
  public detailStateClose = new Subject();
  // ------------------ users .---------------------------------

constructor(private svc:PersonService, private http: HttpClient) {

    // merge user action streams into vm$ change stream
    this.vm$ = merge(
      this.getItemsChange$,   // load items -> list items
      this.addChange$,        // add/update item
      this.deleteChange$,     // delete item
      this.detailChange$,     // show item details
      this.detailCloseChange$ // close item details
    ).pipe(
      scan( (oldVm:PersonVm, mutateFn:PersonVmFn) => mutateFn(oldVm), {persons:[]} as PersonVm )
    );
  
} // constructor

// -------------- persons --------------------------------
// load items from server
private getItemsChange$ = this.svc.getPersons$.pipe(
  map( persons => ( vm: PersonVm) => ({ ...vm, persons }) )
)
// add/update item localy
// todo: add item on the server, load item from server, refresh item list
private addChange$ = this.addState.pipe(
  // tap(p => console.log("add person:", p)),
  map(person => (vm:PersonVm) => ({...vm, persons: [...vm.persons , person ] })),
)
private updateChange$ = this.updateState.pipe(
  map( updatePerson => (vm: PersonVm)=>{
    const personIndex = vm.persons.findIndex(p=>p===updatePerson);
    // spread operator to maintain immutability of the persons array
    const persons = [
      ...vm.persons.slice(0,personIndex), updatePerson, ...vm.persons.slice(personIndex+ 1)];
    return {...vm, persons};
  })
);
// delete item localy
private deleteChange$ = this.deleteState.pipe(
  map( item => (vm:PersonVm) => ({...vm, persons: vm.persons.filter(p => p.id !==item.id) }))
)
// show item details
private detailChange$ = this.detailState.pipe(
  map( selectedPerson => (vm:PersonVm) => ({...vm, selectedPerson }))
)
// close item details
private detailCloseChange$ = this.detailStateClose.pipe(
  map( _ => (vm:PersonVm) => ({...vm, selectedPerson:null }))
)
// ----------------- persons -------------------------------

} // class

