import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PubNubReact from 'pubnub-react';

import SpeechRecognition from 'react-speech-recognition';

import Sentry from 'react-activity/lib/Sentry';

import bmwThinking from '../images/bmw_thinking.gif';
import bmwSad from '../images/bmw_sad.gif';

class MainScreen extends Component {

  state = {
    loading: true,
    response: ''
  }

  constructor(props) {
    super(props);
    this.msg = new SpeechSynthesisUtterance();
    this.voices = window.speechSynthesis.getVoices();
    this.avatarStates = [bmwThinking, bmwSad];
    this.pubnub = new PubNubReact({
        publishKey: 'pub-c-08bc673e-b941-4909-9e97-3c388077baef',
        subscribeKey: 'sub-c-e9df644a-3b9d-11e9-9010-ca52b265d058'
    });
    this.pubnub.init(this);
  }

  componentWillMount() {
      this.pubnub.subscribe({
          channels: ['amicus_global'],
          withPresence: true
      });

      this.pubnub.getMessage('amicus_global', (msg) => {
          if (msg != null && msg.message != null){
            this.setState({response: msg.message.description, loading: false});
            console.log(msg.message.description);
          }
          console.log(msg);
      });

      const { startListening, resetTranscript, browserSupportsSpeechRecognition } = this.props;
      if (browserSupportsSpeechRecognition) {
        console.log("[MainScreen] Browser supports speech recognition");
        resetTranscript();
        //startListening();
      }

      /*this.pubnub.getStatus((st) => {
          this.pubnub.publish({
              message: 'hello world from react',
              channel: 'amicus_global'
          });
      });*/
  }

  componentWillUnmount() {
      this.pubnub.unsubscribe({
          channels: ['amicus_global']
      });
  }

  say(message) {
    this.msg.voice = this.voices[4];
    this.msg.voiceURI = "native";
    this.msg.volume = 1;
    this.msg.rate = 1;
    this.msg.pitch = 0.8;
    this.msg.text = message;
    this.msg.lang = 'en-US';
    speechSynthesis.speak(this.msg);
  }


  debugSend = () => {
    const { transcript, listening, resetTranscript } = this.props;
    if (!listening) return;

    this.pubnub.publish({
        message: transcript,
        channel: 'amicus_delivery'
    });

    resetTranscript();
  }

  render() {

    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">

        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '20rem'}}>
          <div className="font-light text-2xl mx-auto">amicus</div>
          <div className="flex flex-col bg-grey-darkest rounded-lg shadow-lg p-5">
            {this.viewAvatar()}
            {this.viewSpokenText()}
            {this.viewResponse()}
            {this.sayDialog()}
            <Sentry className="mx-auto mt-3" color="#FFFFFF" size={20}/>
            {this.viewDebug()}
          </div>
        </div>
      </div>
    );
  }



  sayDialog = () => {
    let { response } = this.state;

    return (
      <div className="voice">
        {this.say(response)}
      </div>
    );
  }

  viewAvatar = () => {
    let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];
    return (
      <img src={source} alt="Smile" className="m-3 w-48 h-48 rounded-full"/>
    );
  }

  viewSpokenText = () => {
    const { transcript, listening } = this.props;
    if (!listening) return;

    return (
      <div className="text-white text-center mx-auto mt-3">
        {transcript}
      </div>
    );
  }

  viewResponse = () => {
    let { response } = this.state;

    let classMod = "text-grey text-center mx-auto mt-3"
    /*if (response === "") {
      response = "I'm listening to you";
    }*/

    return (
      <div className={classMod}>
        {response}
      </div>
    );
  }

  viewDebug = () => {
    return (
      <div className="text-grey text-center mx-auto mt-3">
        <button className="bg-blue hover:bg-blue-dark text-white font-bold py-2 px-4 rounded"
          onClick={this.debugSend}>
          Debug Send
        </button>
      </div>
    );
  }

}

MainScreen.propTypes = {
  // Props injected by SpeechRecognition
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
};

const options = { autoStart: false }
export default SpeechRecognition(options)(MainScreen)
