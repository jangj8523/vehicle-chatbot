import React, { Component } from 'react';

import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";

import MainScreen from './screens/MainScreen';

class App extends Component {

  delay(){
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  componentDidMount(){
    this.delay().then(() => {
      this.removeLoadingScreen();
    });
  }

  removeLoadingScreen = () => {
    const ele = document.getElementById('ipl-progress-indicator')
    if(ele){
      // fade out
      ele.classList.add('available')
      setTimeout(() => {
        // remove from DOM
        ele.outerHTML = ''
      }, 2000)
    }
  }

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
