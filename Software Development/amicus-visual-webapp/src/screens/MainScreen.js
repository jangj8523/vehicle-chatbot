import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';

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

  render() {

    return (
      <div className="flex h-full bg-woodsmoke text-grey-lighter">

        <div className="flex flex-col h-auto mx-auto my-auto" style={{width: '20rem'}}>
          <div className="font-light text-2xl mx-auto">amicus</div>
          <div className="flex flex-col bg-grey-darkest rounded-lg shadow-lg p-5">
            {this.viewAvatar()}
            {this.viewResponse()}
            <Sentry className="mx-auto mt-3" color="#FFFFFF" size={20}/>
          </div>
        </div>
      </div>
    );
  }

  viewAvatar = () => {
    let source = this.avatarStates[Math.floor(Math.random() * this.avatarStates.length)];
    return (
      <img src={source} alt="Smile" className="m-3 w-48 h-48 rounded-full"/>
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
