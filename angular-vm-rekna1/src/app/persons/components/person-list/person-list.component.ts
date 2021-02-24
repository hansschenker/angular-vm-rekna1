import { IPerson } from './../../types/types';
import { ViewModel } from './../../../shared/viewmodel';
import { Observable } from 'rxjs';
import { PersonsComponent } from './../../persons.component';
import { Component, forwardRef, Input, OnInit, Optional, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss'],
})
export class PersonListComponent implements OnInit {

  @Input() persons$: Observable<IPerson[]>;
  @Output() detailedPerson = new EventEmitter<IPerson>();
  @Output() deletedPerson = new EventEmitter<IPerson>();
  constructor() { 
  }

  ngOnInit(): void {
  }
  detailPerson(person: IPerson){
    this.detailedPerson.emit(person);
  }
  deletePerson(person: IPerson){
    this.deletedPerson.emit(person);
  }
}
