# Angular : the viewmodel of a component as an Observable

This article is about a technique to code Angular apps in a more reactive way. It relies heavily on the use of observables for all actions inside a component. 

## Goals
This technique tries to accomplish the following goals:

* avoid having to manually unsubscribe any subscription.
* being able to use ChangeDetectionStrategy.onPush (for performance reasons)
* being a solution with no dependencies.
* it must be applicable in all cases.
* use observables for all viewmodel mutations and interactions

## Some credits
The technique I will present here was initially inspired by a video by Deborah Kurata on ngConf 2019 [Data composition with Rxjs](https://www.youtube.com/watch?v=Z76QlSpYcck).
The video contained some very intresting ideas but at the time I felt there were some use cases that were left unexplored.

## Basic principle
The solution builds upon three basic principles:

* each component has a viewmodel, and all changes to the viewmodel result from a single (composed) observable.
* the viewmodel observable is defined as an observable of viewmodel mutation functions. 
* the use of the rxjs scan operator which accumulates all viewmodel mutations.

The first allows me to have a single subscription using the async operator which ensures that all subscriptions are unsubscribed automatically.

Viewmodel mutation functions allow me to map any observable to a change in the viewmodel.

The scan operator relies on these viewmodel mutation functions to apply the changes to the previous state of the viewmodel to create the new mutated state when any of the source observables emit a value.

## First example
Let's start with some code, a very simple (but otherwise useless) example to show the basics of the implementation (a simple counter using buttons).

First we define the viewmodel interface :
```javascript
interface ICounterVm {
  counter:number;
}
```
We'll define 2 subjects for increment and decrement button
```javascript

  // normally it could be done with a single subject, but for demonstration
  // purposes, I'll use 2 subjects
  public incrSubj = new Subject<number>;
  public decrSubj = new Subject<number>;
```

We define our viewmodel observable and in the constructor of the component, I define all interactions:

```javascript
public vm$ : Observable<ICounterVm>;
public incrSubj = new Subject<number>;
public decrSubj = new Subject<number>;
constructor() {

  // the subjects are mapped to an anonymous function that 
  // - accepts as parameter the previous state of the viewmodel (vm:ICounterVm)
  // - and that returns the mutated viewmodel
  // they are the viewmodel mutation functions
  const incr$ = this.incrSubj.pipe(
    map( delta => (vm:ICounterVm) => ({...vm, counter:vm.counter+delta}) )
  );
  const decr$ = this.decrSubj.pipe(
    map( delta => (vm:ICounterVm) => ({...vm, counter:vm.counter-delta}))
  );

  // the viewmodel observable is a merge of all mutation observables (incr$ and decr$) 
  // piped into a scan function 
  // scan has two arguments
  // the first is the accumulator (the viewmodel) and the second the mutation function
  // the body of the scan operator executes the mutation function : mutationFn(prevVm) passing the previous state of the viewmodel.
  // this function returns the mutated viewmodel which is the new accumulated value of the vm$ observable
  this.vm$ = merge(of({counter:0}), incr$, decr$).pipe(
    scan( (prevVm:ICounterVm, mutationFn:(vm:ICounterVm)=>ICountVm) 
      => mutationFn(prevVm)
    )
  )
}
```

The view is defined as follows:
```html
<!-- vm$ is subscribed by async pipe and exposes a variable named vm -->
<div *ngIf="vm$ | async as vm">
  Current counter : {{vm.counter}}
  <button type="button" (click)="decrSubj.next(1)">Decrement</button>
  <button type="button" (click)="incrSubj.next(1)">Increment</button> 
</div>
```

## Passing data from current viewmodel as argument
An example where you might need a value of the viewmodel passed as argument of the subject is typically retrieving and showing a detail for an item in a list.

```javascript

interface IPersonVm {
  persons:IPerson[];
  personDetail:IPersonDetail;
}

// this subject will be used to pass the person object 
// when selecting a person from the list
// <div class="personrow" *ngFor="let person of vm.persons" (click)="personDetailSubj.next(person)"> ... </div>
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
    scan( (vm:IPersonVm, mutationFn:(vm:IPersonVm)=>IPersonVm)
       => mutationFn(vm), {persons:[], personDetail:null}
    )
  )
  
}
```
Some things to note about the initial state:

* When the initial state is defined as an argument of the scan function, no value for the viewmodel will be emitted until at least one of the observables in the merge function emits.
* If none of the observables emit a value (e.g. they are all subjects and none of the subjects are triggered in the constructor), 
  * you have to use the method with the **rxjs *of* operator** to provide an initial state. 
  * Beware that this ***of*** observable will not run the scan function, vm$ Observable will immediately emit the value provided with the ***of*** function. (This is inherent to the scan function but I mention it because it tricked me serveral times)

Note also that I'm using a spread operator **{...vm, /\* changes here \*/}** to copy the view model and apply the changes to this copy. This adheres to the principle of immutability. Although this might not be entirely necessary, I try to apply the principle of immutability as much as possible.

## Add, update and delete operations on lists

These kind of interactions become relatively easy with this method. For simplicity I'll leave out http request to push the changes to the server for now. Remember the subjects are defined before the constructor as a property of the component.

```javascript
/***  add example ***/
// add 
public addSubj = new Subject<IPerson>();

// don't forget to add addPerson$ to the merge operator
const addPerson$ = this.addSubj.pipe(
  // spread operator is used on the existing persons list 
  // to add the new person
  map( newPerson => (vm:IPersonVm) => ({
    ...vm, 
    persons:[...vm.persons, newPerson ]
  }))
);

/*** delete example ***/
public deleteSubj = new Subject<IPerson>();

const deletePerson$ = this.deleteSubj.pipe(
  map( personToDelete => (vm:IPersonVm)=>({
    ...vm, 
    persons:vm.persons.filter(p=>p!==personToDelete )
  }))
);

/*** update example ***/
public updateSubj = new Subject<IPerson>();

const updatePerson$ = this.updateSubj.pipe(
  map( personToUpdate => (vm:IPersonVm)=>{
    const indexOfPerson = vm.persons.findIndex(p=>p===personToUpdate);
    // spread operator to maintain immutability of the persons array
    const persons = [
      ...vm.persons.slice(0,indexOfPerson),
      personToUpdate,
      ...vm.persons.slice(indexOfPerson+ 1)
    ];
    return {...vm, persons};
  })
);
```
## Example with server update
Next I will show an example of an update pushed to the server
```javascript
public updateSubj = new Subject<IPerson>();

const updatePerson$ = this.updateSubj.pipe(
  mergeMap( personToUpdate => this.personService.update(personToUpdate) ),
  map( updatedPerson => {
    // this time we can not use the object equality, 
    // because it will be a new object deserialized 
    // from json of update response. In this case 
    // I assume a person has an unqiue identifier called **id**
    const indexOfPerson = vm.persons.findIndex(p=>p.id === updatedPerson.id );
    const persons = [
      ...vm.persons.slice(0,indexOfPerson),
      personToUpdate,
      ...vm.persons.slice(indexOfPerson+ 1)
    ];
    return {...vm, persons};
  })
)
```

## Angular routing 
Often angular routing paramMap or queryParamMap will be needed to determine the initial state of the viewmodel. Since paramMap and queryParamMap are observables they can easily be transformed to a viewmodel mutation function and added to the merge.

```javascript

  constructor(private route:ActivatedRoute) {
    const retrieveData$ = route.paramMap.pipe(
      map( paramMap => +this.paramMap.get('id') ),
      switchMap( id => this.personService.getPerson(id)),
      map( personDetail => (vm:IPersonVm)=> ({...vm, personDetail }))
    )
  };

  this.vm$ = merge(retrieveData$, /* other viewmodel mutations */);
```

## Side effects
If you every need to execute side effects without changing the viewmodel, just map to a mutation function which executes the side effect and returns the previous viewmodel state.

```javascript

  const sideEffect$ = sideEffectSubj.pipe(
    map( _ => (vm:IViewModel)=>{
      // execute side effect here
      return vm;
    })
  );
```

## Composition : using an observable multiple times

Let's consider reloading a list where reloading needs to be done in the following cases:
* the user specifically clicks the reload button
* after deleting an item successfully on the server

We start with the following :

```javascript
public reloadSubj = new Subject<boolean>();
public deleteSubj = new Subject<IItem>();

private delete$ = this.deleteSubj.pipe(
  mergeMap( item => this.itemService.delete(item.Id)),
  map( _ => (vm:IItemListVm) => vm)
);

private reload$ = this.reloadSubj.pipe(
  switchMap( _ => this.itemService.getItems() ),
  map( items => (vm:IItemListVm) => ({...vm, items}))
)

constructor() {
  vm$ = merge(this.reload$, this.delete$).pipe(
    scan( ... )
  )
}
```
In order to reload also on successfull deleting an item, one can combine observables:

```javascript

private reload$ = merge(this.reloadSubj, this.delete$).pipe(
  swicthMap( _ => this.itemService.getItems() ),
  map( items => (vm:IItemListVm)=>({...vm, items}))
);

```

This introduces the following problem : since the delete$ observable is subscribed twice (merge subscribes directly to delete$ and indirectly a second time via reload$) the delete request will be executed twice. Luckily this can be easily solved by the share operator.

```javascript
private delete$ = this.deleteSubj.pipe(
  mergeMap( item => this.itemService.delete(item.Id)),
  share()
  map( _ => (vm:IItemListVm) => vm)
);
```
> share will share an observable result in the future, meaning that if one subscribes at some time x, this subscriber will not get any value that was emitted previously to that time. So in the case of the delete$ observable which is subscribed to multiple times the share operator prevents the request from being executed multiple times.

> shareReplay on the other hand is more suitable as a caching mechanism for late subscribers. They will get previously emitted values as well, how much depends upon the bufferSize parameter. So it can be used with an observable which retrieves data from the server and that needs to be shared among mulitple components without refetching the data again. 

## Client side filtering

This section will describe how to perform client side filtering. You might be tempted to implement filtering as another mutation function, something like this:

```javascript

  interface IPersonVm {
    persons:IPerson[];
  }

  class PersonListComponent {
    public vm$ : Observable<IPersonVm>;
    public filterSubj : BehaviorSubj<string>(null);

    constructor(private dataService:DataService) {
      this.vm$ = merge(this.retrievePerson$, this.filterPersons$).pipe(
        scan( (vm:IPersonVm, mutationFn:(vm:IPersonVm)=>IPersonVm)
            => mutationFn(vm), {persons:[], personDetail:null}
          )
      );
    }
    private retrievePersons$ = this.dataService.getPersons().pipe(
      map( persons => ({...vm, persons }) )
    );
    // attempt filtering as another mutation on the viewmodel 
    private filterPersons$ = this.filterSubj.pipe(
      map( filterArg => ({
        ...vm, 
        persons:persons.filter(p=>filterArg==null || p.name.includes(filterArg))
      }) )
    )
  }

```
This will work only the first time the filterSubj changes. The second time vm.persons will contain an already filtered persons array while we need to start with the original array get the correct list. As a consequence we need to pull the filtering out of the scan cycle.

To solve this we will apply the filter on the result of the viewmodel mutation observable.

```javascript
  constructor(private dataService) {
    
    const unfilteredVm$ =  merge(this.retrievePerson$).pipe(
        scan( (vm:IPersonVm, mutationFn:(vm:IPersonVm)=>IPersonVm)
            => mutationFn(vm), {persons:[], personDetail:null}
          )
    );
 
    // not anymore part of the viewmodel mutation scan cycle
    this.vm$ = combineLatest(unfilteredVm$, this.filterSubj).pipe(
      map( ([vm, filterArg]) => ({
          ...vm, 
          persons:vm.persons.filter(filterArg==null || p.name.includes(filterArg))
      }))
    )

  }
```

The above code has only one problem. It will filter always, even if maybe something in the viewmodel changed that does not require to filter persons again. To optimize this we need to change to code so that filtering only happens when filterSubj really has changed. We could store previous value on the component, but I will continue to leverage the power of observables to achieve the same using the scan function again.

```javascript

  this.vm$ = combineLatest(unfilterdVm$, this.filterSubj).pipe(
    scan( ([prevVm, prevFilterArg],[nextVm, nextFilterArg]) => {
      const shouldFilter = prevFilterArg!=nextFilterArg;
      const persons = shouldFilter 
        ? nextVm.persons.filter(p=>p.name.includes(nextFilterArg))
        : prevVm.persons
      return [{...nextVm,persons},nextFilterArg];
    }),
    map( [vm,_] => vm)
  )
```
This will require some explanation. 

First combineLatest will emit an array with two elements **[vm: IVm, filterArg: string]**
each time unfilteredVm$ or filterSubj changes.

We need the previous value of the viewmodel because if the filterArg did not change we will return the previous state of the person array and not filter again.

We need the previous value of the filterArg to compare with the new filterArg to determine if the filterArg has changed (the isFilterChanged boolean).

> The arguments of the scan functions may look a bit weird, but it is just a special case of array destructuring. Remember the scan function has two arguments, the previous value and the next value.
> If written without destructuring it would look like this:
> ```javascript
>  scan( (prev, next) => {
>    const prevVm = prev[0];
>    const prevFilterArg = prev[1];
>    const nextVm = next[0];
>    const nextFilterArg = next[1]; 
>    ...
>  })
>```
> Use whatever makes you most confortable.

If the filter has changed we will apply filtering to nextVm.persons. nextVm.persons will be the most up to date unfiltered list of persons.
If the filter did not chang we will return prevVm.persons which is the already filtered list of persons from a previous run.

Then for the scan function to work we need to return again an array with 2 elements, the first item being the new state of the viewmodel and the second the new filterArg.

Finally we need another map function because our view expects a IPersonVm object and not an array.

Take care this example only describes the most simple use case. If for example the viewmodel mutation functions can add, remove or update persons, you also have to apply filtering after these mutations. shouldFilter could be written like this (vm.persons must be an immutable list)

```javascript
  const shouldFilter = (prevFilterArg!=nextFilterArg) || (prevVm.persons!==nextVm.persons)
```

## Debugging 
Debugging is much more difficult. It's hard to set breakpoints (though not impossible) inside observable pipelines. You'll often have to resort to using console.log statements and/or the rxjs tap operator to see what is going on.

## Final thoughts

When we compare this method with more traditional methods I think it can be summarized as follows:
* this method requires you to write some more code especially in simple components.
* I don't think this method has any limitations, so far I have been able to use it for every case I encountered.
* a good knowledge of Rxjs is required to correctly implement this method
 
## Observable patterns

In this article the following observable patterns were used:

* **merge** to create the composed viewmodel observable
* **scan** to accumulate viewmodel mutations and to optimize client side filtering
* **subjects** to perform interactions from the view on the viewmodel
* **mergeMap** to map to a server request for updates
* **switchMap** to map to server requests retrieving data which may be cancelled 
* **map** to transform data especially data to a viewmodel mutation
* **share** to prevent multiple executions of a part of the pipeline when subscribing multiple times to an observable
* **shareReplay** to cache data to be used in mulitple components

other operators not mentioned in this article
* **zip** is used sometimes when I need the value of a subject combined with the result of the pipe operator applied to the subject.
* **forkJoin** to wait for multiple http requests 

## Subject, BehaviorSubject, ReplaySubject

When to use which ?
* Subject has no initial value and no current value, late subscribers will not receive last emitted value 
* ReplaySubject has no initial value but has a current value, late subscribers will receive also last emitted value
* BehaviorSubject has an initial value and a current value, late subscribers will receive also last emitted value


  




