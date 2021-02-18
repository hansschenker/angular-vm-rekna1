import { PersonService } from './person.service';
import { Component, OnInit } from '@angular/core';
// rxjs
import { Observable, Subject, merge } from 'rxjs';
import { map, scan, mergeMap } from 'rxjs/operators';
// persons
import {IPerson, IPersonDetail, IPersonVm } from "./types/types";

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss']
})
export class PersonsComponent {


  public personDetailSubj = new Subject<IPerson>();
public vm$ : Observable<IPersonVm>;

constructor(private personService:PersonService) {

  // retrieving list of persons (could be a http request)
  const personList$ = this.personService.getPersons().pipe(
    map( persons => (vm:IPersonVm) => ({...vm, persons}) )
  );

  // select a person, get detail and set it on viewmodel
  const personDetail$ = this.personDetailSubj.pipe(
    mergeMap( person => this.personService.getPersonDetail(person.id) ),
    map( personDetail => (vm:IPersonVm) => ({...vm, personDetail }))
  );

  // in this example the initial viewmodel state is provided with the second 
  // parameter of the scan function. Alternatively one could provide an initial 
  // state with the rxjs of function 
  const vm$ = merge(personList$, personDetail$).pipe(
    scan( (vm:IPersonVm, mutationFn:(vm:IPersonVm)=>IPersonVm) => mutationFn(vm), {persons:[], personDetail:null}
    )
  )
  
}
}
