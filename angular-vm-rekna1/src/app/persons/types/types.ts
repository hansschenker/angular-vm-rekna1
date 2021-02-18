export interface IPerson {
  id: number;
  name: string;
  age: number;
  height?: number;
  weight?: number;
  bmi?: number;
}
export interface IPersonDetail {
  person: IPerson;
}
export interface IPersonVm {
  persons:IPerson[];
  personDetail:IPersonDetail;
}