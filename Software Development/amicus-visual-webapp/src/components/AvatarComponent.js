import React, { Component } from 'react';

import bmwThinking from '../images/bmw_thinking.gif';
import bmwSad from '../images/bmw_sad.gif';

class AvatarComponent extends Component {

  constructor(props) {
    super(props);
    this.avatarStates = [bmwThinking, bmwSad];
  }

  render() {
    let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];

    return (
      <div>
        <div className="flex content-center bg-pitch-black w-full rounded-lg">
          <img src={source} alt="Smile" className="invert-img w-64 h-64 mx-auto rounded-full"/>
        </div>
        {this.viewStateButtons()}
      </div>
    );
  }

  viewStateButtons = () => {

    return (
      <div className="absolute pin-t pin-r m-3 mt-5 text-center">
        <div className="flex flex-col">
          <div>Simulate</div>
          <button className="bg-red hover:bg-red-dark text-white font-bold py-2 px-4 rounded">
            Happy
          </button>
          <button className="bg-grey hover:bg-grey-dark text-black font-bold py-2 px-4 mt-2 rounded">
            Sad
          </button>
          <button className="bg-grey hover:bg-grey-dark text-black font-bold py-2 px-4 mt-2 rounded">
            Neutral
          </button>
        </div>
      </div>
    );
  }
}

export default AvatarComponent;
