import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';

import RecordComponent from '../components/RecordComponent';
import AvatarComponent from '../components/AvatarComponent';

//import Sentry from 'react-activity/lib/Sentry';
import Dots from 'react-activity/lib/Dots';

import "../css/MainScreen.css";

class MainScreen extends Component {

  state = {
    loading: true,
    response: '',
    hints: ["let's talk", "ask me about the weather", "say \"hey Amicus\""],
    currentHint: 0,
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
            this.setState({response: msg.message.description, loading: false});
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

  render() {
    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">
        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '40rem'}}>
          <div className="flex flex-col p-5">
            <AvatarComponent/>
            <div className="h-5"/>

            {this.viewIntro()}
            <div className="h-5"/>

            {this.viewResponse()}
            <Dots className="mx-auto mt-3" color="#FFFFFF" size={20}/>
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
