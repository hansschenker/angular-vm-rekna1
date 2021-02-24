import { IPerson } from './../../types/types';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'person-form',
  templateUrl: './person-form.component.html',
  styleUrls: ['./person-form.component.scss']
})
export class PersonFormComponent implements OnInit {
  @Output() personAdded = new EventEmitter<IPerson>()
  addedPerson: IPerson = {id:0, name:'test', age:0, height:0, weight:0, bmi:0}
  constructor() { }

  ngOnInit(): void {
  }
  addPerson(person: IPerson) {
    console.log("addPerson:", person)
    this.personAdded.emit(person);
  }
}
