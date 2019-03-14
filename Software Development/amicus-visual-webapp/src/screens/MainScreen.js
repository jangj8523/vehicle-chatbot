import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';
import { Message } from 'react-chat-ui';

import RecordComponent from '../components/RecordComponent';
import AvatarComponent from '../components/AvatarComponent';
import MessageChatComponent from '../components/MessageChatComponent';

//import Sentry from 'react-activity/lib/Sentry';
import Dots from 'react-activity/lib/Dots';

import "../css/MainScreen.css";

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
    newMessages.push(new Message({ id: isFromBot ? 1 : 0, message: msg }));

    //there needs to be a limit

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
    console.log("speaking...");
  }

  render() {
    const { messages } = this.state;

    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">
        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '40rem'}}>
          <div className="flex flex-col p-5">
            <AvatarComponent/>
            <div className="h-5"/>

            {this.viewIntro()}
            <div className="h-5"/>

            {/*this.viewResponse()*/}
            {/*<Dots className="mx-auto mt-3" color="#FFFFFF" size={20}/>*/}
            {/*<div className="h-5"/>*/}

            <MessageChatComponent messages={messages}/>
            <div className="h-5"/>

            <RecordComponent onPublish={(msg) => {this.pubnubPublish(msg)}}/>

            {this.viewFeedback()}
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

}

export default MainScreen;
