/** TodoMVC model definitions **/
declare interface TodoItemData {
  id?: TodoItemId;
  text?: string;
  completed?: boolean;
}

declare type TodoItemId = number;

declare type TodoFilterType = 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED';

declare type TodoStoreState = TodoItemData[];


// login
declare type UserStoreState = any

declare type UserItem = any
//declare type User = Map<string, string>

declare type MenuStoreState = any
declare type TabBarStoreState = any


