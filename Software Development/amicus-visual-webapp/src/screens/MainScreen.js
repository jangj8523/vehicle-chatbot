import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PubNubReact from 'pubnub-react';

import SpeechRecognition from 'react-speech-recognition';

//import Sentry from 'react-activity/lib/Sentry';
import Spinner from 'react-activity/lib/Spinner';
import Dots from 'react-activity/lib/Dots';

import microphone from '../images/microphone.png';
import bmwThinking from '../images/bmw_thinking.gif';
import bmwSad from '../images/bmw_sad.gif';

import "../css/MainScreen.css";

class MainScreen extends Component {

  state = {
    loading: true,
    response: '',
    hints: ["let's talk", "ask me about the weather", "say \"hey Amicus\""],
    currentHint: 0,
    isListening: false,
  }

  constructor(props) {
    super(props);
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

      this.timeout = setInterval(() => {
        const { currentHint } = this.state;
        this.setState({currentHint: currentHint+1});
      }, 5000);

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

  componentDidUpdate(prevProps, prevState){
    //this.say("go home");
    if (this.state.response !== prevState.response) {
      this.sayDialog();
    }

  }

  say(message) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10];
    msg.voiceURI = "native";
    msg.volume = 1;
    msg.rate = 1.0;
    msg.pitch = 0.8;
    msg.text = message;
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
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

  startListeningAPI = () => {
    console.log("press");
    //this.setState({isListening: true});
  }

  render() {

    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">
        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '40rem'}}>
          <div className="flex flex-col p-5">
            {this.viewAvatar()}
            <div className="h-5"/>
            {this.viewIntro()}
            <div className="h-5"/>
            {this.viewSpokenText()}
            {this.viewResponse()}
            <Dots className="mx-auto mt-3" color="#FFFFFF" size={20}/>
            <div className="h-5"/>
            {this.viewFeedback()}
          </div>
        </div>
        {this.viewDebug()}
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

  viewIntro = () => {
    return (
      <div className="font-light text-2xl mx-auto text-center">hey there! my name is
        <div className="syncopate text-5xl">amicus</div>
      </div>
    );
  }

  viewAvatar = () => {
    let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];
    return (
      <div className="flex content-center bg-pitch-black w-full rounded-lg">
        <img src={source} alt="Smile" className="invert-img w-64 h-64 mx-auto rounded-full"/>
      </div>
    );
  }

  viewFeedback = () => {
    const { transcript, listening, isListening } = this.props;
    const { currentHint, hints } = this.state;

    const hintText = hints[currentHint % hints.length];

    return (
      <div className="w-full text-center text-grey-dark">
        <button className="flex flex-col mx-auto relative bg-grey-light hover:bg-grey-dark w-16 h-16 rounded-full"
                onClick={() => {this.startListeningAPI()}}>
          <img src={microphone} alt="Mic" className="z-10 absolute pin-l pin-r pin-b pin-t w-16 h-16 p-2"/>
          {/*!listening && <Sentry className="z-0 w-16 h-16" color="#FFFFFF" size={30}/>*/}
          <Spinner className="z-0" color="#FFFFFF" size={47}/>
        </button>
        <div className="h-3"/>
        <div className="text-sm" key={hintText}>{hintText}</div>
      </div>
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
      <div className="absolute pin-b pin-r m-3 text-grey text-center">
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
