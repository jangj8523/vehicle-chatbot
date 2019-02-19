import React, { Component } from 'react';
import Sentry from 'react-activity/lib/Sentry';

import smileImg from '../images/smile.png';

class MainScreen extends Component {
  render() {
    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">

        <div className="flex flex-col w-auto h-auto mx-auto my-auto">
          <div className="font-light text-3xl">Amicus</div>
          <div className="flex flex-col bg-grey-light rounded-lg shadow-lg p-5">
            <img src={smileImg} alt="Smile" className="m-10 h-32"></img>
            <Sentry className="mx-auto" color="#110910" size={35}/>
          </div>
        </div>
      </div>
    );
  }
}

export default MainScreen;
