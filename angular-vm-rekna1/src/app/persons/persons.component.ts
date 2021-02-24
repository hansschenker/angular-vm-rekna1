import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
// rxjs
import { Observable, Subject, merge, BehaviorSubject } from 'rxjs';
import { map, scan, mergeMap, startWith, tap, filter, switchMap, share } from 'rxjs/operators';
// persons
import { ViewModel, VmFn } from './../shared/viewmodel';
import {IPerson  } from "./types/types";
import { PersonService } from './person.service';
import { PersonListComponent } from './components/person-list/person-list.component';
import { PersonDataService } from './person-data.service';
import { Router } from '@angular/router';

interface PersonVm extends ViewModel<IPerson> {
  persons: IPerson[];
  addedPerson?: IPerson;
  selectedPerson?: IPerson;
}

 type PersonVmFn = (vm: PersonVm) => PersonVm;

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss']
})
export class PersonsComponent implements AfterViewInit {

  // vm$ : public viewmodel merge all changes$ into viewmodel
  public vm$ : Observable<PersonVm>;
  // create user action state streams: crudl (create, read, update, delete, list)
  public addState = new Subject<IPerson>();

  public updateState = new Subject<Partial<IPerson>>();

  public deleteState = new Subject<IPerson>();
  public reloadState = new Subject();
  public detailState = new Subject<IPerson>();
  public detailStateClose = new Subject();
  // ------------------ users .---------------------------------
ngAfterViewInit(){

}

constructor(private svc:PersonDataService, private http: HttpClient, private router: Router) {

    // merge user action streams into vm$ change stream
    this.vm$ = merge(
      this.getItemsChange$,   // load items -> list items
      this.addChange$,        // add/update item
      this.deleteChange$,     // delete item
     // this.reloadChange$,
      this.detailChange$,     // show item details
      this.detailCloseChange$ // close item details
    ).pipe(
      scan( (oldVm:PersonVm, mutateFn:PersonVmFn) => mutateFn(oldVm), {persons:[]} as PersonVm )
    );
  
} // constructor

// -------------- persons --------------------------------
// source: 
// load items from server
private getItemsChange$ = this.svc.getAll$.pipe(
  map( persons => ( vm: PersonVm) => ({ ...vm, persons }) )
)
// pessimistic add: add item on server and then localy
private addChange$ = this.addState.pipe(
  mergeMap( (person: IPerson) => this.svc.create$(person)),
  map(
    person => (vm:PersonVm) => ({...vm, persons: [...vm.persons , person ] }),
    ),
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
  tap( ps => console.log("server delete:", ps)),
  mergeMap( p => this.svc.delete$(p.id)),
  mergeMap( _ => this.svc.getAll$),
  map( persons => ( vm: PersonVm) => ({ ...vm, persons }))
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
detailPerson(person: IPerson) {
  this.detailState.next(person);
}
deletePerson(person: IPerson) {
  console.log("persons-delete-person:", person)
  this.deleteState.next(person);
}
} // class

