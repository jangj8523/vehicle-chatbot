import React, { Component } from 'react';

import bmwThinking from '../images/animations/01-loading.gif';
import bmwSad from '../images/animations/01-sad.gif';

class AvatarComponent extends Component {

  constructor(props) {
    super(props);
    this.avatarStates = [bmwThinking, bmwSad];
  }

  render() {
    let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];

    return (
      <div>
        <div className="flex content-center bg-pitch-black w-full">
          <img src={source} alt="Smile" className="w-64 h-64 mx-auto"/>
        </div>
      </div>
    );
  }

}

export default AvatarComponent;
