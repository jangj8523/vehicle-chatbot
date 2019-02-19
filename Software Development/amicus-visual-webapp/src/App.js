import React, { Component } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";

import MainScreen from './screens/MainScreen';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App h-screen">
          <Switch>
            <Route exact={true} path="/" component={MainScreen} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
