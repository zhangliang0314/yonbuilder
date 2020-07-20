import { createStore, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import createLogger from 'redux-logger';
import { reducers } from '../reducers'
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux'
import thunkMiddleware from 'redux-thunk'
import { createMemoryHistory } from 'history'
import { browserHistory } from 'react-router'

let store;
let history = null;
if (cb.rest.isWeChat)
  history = createMemoryHistory();
else
  history = browserHistory

// Build the middleware for intercepting and dispatching navigation actions
const historyMiddleware = routerMiddleware(history)

export function configureStore (initialState) {
  const middlewares = [historyMiddleware, thunkMiddleware]
  if (process.env.NODE_ENV === 'development') {
    middlewares.push(createLogger())
    store = createStore(reducers, initialState, composeWithDevTools(
      applyMiddleware(
        ...middlewares
      )
    ));
  } else {
    store = createStore(reducers, initialState, compose(
      applyMiddleware(
        ...middlewares
      )
    ));
  }

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers');
      store.replaceReducer(nextReducer);
    });
  }

  return store;
}

export const createHistory = (store, path) => {
  // if (process.env.__CLIENT__)
  return syncHistoryWithStore(history, store)
  // return createMemoryHistory(path)
}
