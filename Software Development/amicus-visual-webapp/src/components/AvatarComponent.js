import React, { Component } from 'react';
import PropTypes from 'prop-types';

import bmwThinking from '../images/animations/01-loading.gif';
import bmwSad from '../images/animations/01-sad.gif';

import { EMOTIONS_ENUM } from '../screens/MainScreen';

export const SUPPORTED_ANIMATIONS = Object.freeze({"bmw": "01"});

class AvatarComponent extends Component {

  state = {
    currentAnimation: SUPPORTED_ANIMATIONS.bmw,
  }

  constructor(props) {
    super(props);
    this.avatarStates = [bmwThinking, bmwSad];
  }

  happy = () => {
    const { currentAnimation } = this.state;
    return <img alt="happy" src={ require('../images/animations/' + currentAnimation + '-happy.gif')} className="w-64 h-64 mx-auto" />
  }

  sad = () => {
    const { currentAnimation } = this.state;
    return <img alt="sad" src={ require('../images/animations/' + currentAnimation + '-sad.gif')} className="w-64 h-64 mx-auto" />
  }

  neutral = () => {
    const { currentAnimation } = this.state;
    return <img alt="neutral" src={ require('../images/animations/' + currentAnimation + '-neutral.gif')} className="w-64 h-64 mx-auto" />
  }

  loading = () => {
    const { currentAnimation } = this.state;
    return <img alt="loading" src={ require('../images/animations/' + currentAnimation + '-loading.gif')} className="w-64 h-64 mx-auto" />
  }

  render() {
    //let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];

    return (
      <div>
        <div className="flex content-center bg-pitch-black w-full">
          {this.viewAvatarImage()}
          {/*<img src={source} alt="Smile" className="w-64 h-64 mx-auto"/>*/}
        </div>
      </div>
    );
  }

  viewAvatarImage = () => {
    const { emotion } = this.props;
    const selectedEmotion = emotion ? emotion : EMOTIONS_ENUM.happy;

    if (selectedEmotion === EMOTIONS_ENUM.neutral) {
      return this.neutral();
    } else if (selectedEmotion === EMOTIONS_ENUM.happy) {
      return this.happy();
    } else if (selectedEmotion === EMOTIONS_ENUM.sad) {
      return this.sad();
    } else if (selectedEmotion === EMOTIONS_ENUM.loading) {
      return this.loading();
    }
  }

}

AvatarComponent.propTypes = {
  emotion: PropTypes.number,
};

export default AvatarComponent;
