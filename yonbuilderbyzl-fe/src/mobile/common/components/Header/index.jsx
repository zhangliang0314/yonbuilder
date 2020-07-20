import * as React from 'react';
import { TodoTextInput } from '../TodoTextInput';
// import {Action} from 'redux-actions';

export class Header extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.handleSave = this.handleSave.bind(this);
  }

  handleSave (text) {
    if (text.length) {
      this.props.addTodo({ text });
    }
  }

  render () {
    return (
      <header>
        <h1>Todos</h1>
        <TodoTextInput
          newTodo
          onSave={this.handleSave}
          placeholder='What needs to be done?' />
      </header>
    );
  }
}
