import React, { Component } from 'react';

import bmwThinking from '../images/bmw_thinking.gif';
import bmwSad from '../images/bmw_sad.gif';

class AvatarComponent extends Component {

  state = {
    selectedEmotion: 0,
  }

  constructor(props) {
    super(props);
    this.avatarStates = [bmwThinking, bmwSad];
  }

  selectEmotion = (index) => {
    if (this.state.selectedEmotion !== index) {
      this.setState({selectedEmotion: index});
    }
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

    const { selectedEmotion } = this.state;

    const globalClassName = " font-bold py-2 px-4 rounded mt-2";
    const selectedClassName = " bg-red hover:bg-red-dark text-white" + globalClassName;
    const neutralClassName = " bg-grey hover:bg-grey-dark text-black" + globalClassName;

    return (
      <div className="absolute pin-t pin-r m-3 mt-5 text-center">
        <div className="flex flex-col">
          <div>Simulate</div>
          <button className={selectedEmotion === 0 ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(0)}>
            Happy
          </button>
          <button className={selectedEmotion === 1 ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(1)}>
            Sad
          </button>
          <button className={selectedEmotion === 2 ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(2)}>
            Neutral
          </button>
        </div>
      </div>
    );
  }
}

export default AvatarComponent;
