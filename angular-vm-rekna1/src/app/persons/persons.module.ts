import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from "@angular/common/http";
// persons
import { PersonsRoutingModule } from './persons-routing.module';
import { PersonsComponent } from './persons.component';
import { PersonListComponent } from './components/person-list/person-list.component';
import { PersonListItemComponent } from './components/person-list-item/person-list-item.component';
import { PersonDetailsComponent } from './components/person-details/person-details.component';
import { PersonFormComponent } from './components/person-form/person-form.component';


@NgModule({
  declarations: [PersonsComponent, PersonListComponent, PersonListItemComponent, PersonDetailsComponent, PersonFormComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    PersonsRoutingModule
  ],
  exports: [PersonListComponent, PersonListItemComponent, PersonDetailsComponent, PersonFormComponent]
})
export class PersonsModule { }
