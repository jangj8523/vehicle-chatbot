import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';
import { Message } from 'react-chat-ui';

import RecordComponent from '../components/RecordComponent';
import AvatarComponent from '../components/AvatarComponent';
import MessageChatComponent from '../components/MessageChatComponent';

//import Sentry from 'react-activity/lib/Sentry';
//import Dots from 'react-activity/lib/Dots';

import "../css/MainScreen.css";

const MESSAGE_LIMIT = 4;

class MainScreen extends Component {

  state = {
    loading: true,
    response: '',
    pitch: 0.0,
    volume: 0.0,
    rate: 0.0,
    emotion: '',
    hints: ["let's talk", "ask me about the weather", "say \"hey Amicus\""],
    currentHint: 0,
    messages: [],
    selectedEmotion: 0,
  }

  constructor(props) {
    super(props);
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
            this.setState({response: msg.message.description, loading: false, pitch: msg.message.pitch, volume: msg.message.volume, rate: msg.message.rate, emotion: msg.message.emotion})
            this.recordMessage(msg.message.description, true);
            console.log(msg.message.description);
          }
          console.log(msg);
      });

      this.timeout = setInterval(() => {
        const { currentHint } = this.state;
        this.setState({currentHint: currentHint+1});
      }, 5000);
  }

  componentWillUnmount() {
      this.pubnub.unsubscribe({
          channels: ['amicus_global']
      });
  }

  componentDidUpdate(prevProps, prevState){
    if (this.state.response !== prevState.response) {
      this.sayDialog();
    }
  }

  selectEmotion = (index) => {
    if (this.state.selectedEmotion !== index) {
      this.setState({selectedEmotion: index});
    }
  }

  pubnubPublish = (message) => {
    if (message === "") return;

    this.pubnub.publish({
        message: message,
        channel: 'amicus_delivery'
    });

    this.recordMessage(message, false);
  }

  recordMessage = (msg, isFromBot) => {
    const { messages } = this.state;
    let newMessages = messages;

    if (newMessages.length >= MESSAGE_LIMIT) { //4 max
      newMessages.splice(0,1);
    }
    //there needs to be a limit

    newMessages.push(new Message({ id: isFromBot ? 1 : 0, message: msg }));
    this.setState({messages: newMessages});
  }

  say(message) {
    let { pitch, volume, rate } = this.state;
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10];
    msg.voiceURI = "native";

    if (volume) {
      msg.volume = volume;
    }

    if (rate) {
      msg.rate = rate;
    }

    if (pitch) {
      msg.pitch = pitch;
    }

    msg.text = message;
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
  }

  sayDialog = () => {
    let { response } = this.state;

    return (
      <div className="voice">
        {this.say(response)}
      </div>
    );
  }

  render() {
    const { messages } = this.state;

    return (
      <div className="flex h-full bg-pitch-black text-grey-lighter">
        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '40rem'}}>
          <div className="flex flex-col p-5">
            <AvatarComponent/>
            <div className="h-5"/>

            {this.viewIntro()}
            <div className="h-5"/>

            {/*this.viewResponse()*/}
            {/*<Dots className="mx-auto mt-3" color="#FFFFFF" size={20}/>*/}
            {/*<div className="h-5"/>*/}

            {this.viewHistory()}
            <MessageChatComponent messages={messages}/>
            <div className="h-5"/>

            <RecordComponent onPublish={(msg) => {this.pubnubPublish(msg)}}/>

            {this.viewFeedback()}
            {this.viewStateButtons()}
          </div>
        </div>
      </div>
    );
  }

  viewHistory = () => {
    if (this.state.messages.length < MESSAGE_LIMIT) return;

    return (
      <div className="text-grey-dark text-sm text-center mx-auto">[no prior message history available]</div>
    );
  }

  viewIntro = () => {
    return (
      <div className="font-light text-2xl mx-auto text-center">hey there! my name is
        <div className="syncopate text-5xl">amicus</div>
      </div>
    );
  }

  viewFeedback = () => {
    const { currentHint, hints } = this.state;

    const hintText = hints[currentHint % hints.length];

    return (
      <div className="w-full mt-3 text-center text-grey-dark">
        <div className="text-sm" key={hintText}>{hintText}</div>
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

export default MainScreen;
