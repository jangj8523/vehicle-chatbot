import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';
import { Message } from 'react-chat-ui';

import { startNewConversation, sendMessage, pingWatermark } from '../managers/networking/conversation';

import RecordComponent from '../components/RecordComponent';
//import AvatarComponent from '../components/AvatarComponent';
import ThreeAvatarComponent from '../components/ThreeAvatarComponent';
import MessageChatComponent from '../components/MessageChatComponent';

//import Sentry from 'react-activity/lib/Sentry';
//import Dots from 'react-activity/lib/Dots';

import "../css/MainScreen.css";

const MESSAGE_LIMIT = 4;
export const EMOTIONS_ENUM = Object.freeze({"loading": 0, "happy":1, "sad":2, "neutral":3})

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
    selectedEmotion: EMOTIONS_ENUM.neutral,
    avatarActions: {},
    waterfallId: 0,
    conversationId: null
  }

  constructor(props) {
    super(props);
    this.pubnub = new PubNubReact({
      publishKey : 'pub-c-08bc673e-b941-4909-9e97-3c388077baef',
      subscribeKey : 'sub-c-e9df644a-3b9d-11e9-9010-ca52b265d058'
    });
    this.pubnub.init(this);
  }

  componentWillMount() {
      this.pubnub.subscribe({
          channels: ['amicus_global'],
          withPresence: true
      });

      /*this.pubnub.getMessage('amicus_global', (msg) => {
          if (msg != null && msg.message != null){
            console.log("MESSAGE: ", msg.message);
            this.setState({response: msg.message.description, loading: false, pitch: msg.message.pitch, volume: msg.message.volume, rate: msg.message.rate, emotion: msg.message.emotion})
            //TODO: set state with new avatarActions object
            this.recordMessage(msg.message.description, true);
            this.setAvatarParameters(msg.message);
            console.log(msg.message.description);
          }
          console.log(msg);
      });*/

      this.timeout = setInterval(() => {
        const { currentHint } = this.state;
        this.setState({currentHint: currentHint+1});
      }, 5000);

      this.waterfallRunning = false;
      this.waterfallInterval = setInterval(() => this.waterfall(), 2000);
  }

  componentWillUnmount() {
      this.pubnub.unsubscribe({
          channels: ['amicus_global']
      });
      clearInterval(this.waterfallInterval);
  }

  componentDidUpdate(prevProps, prevState){
    if (this.state.response !== prevState.response) {
      //TODO: jae, the response is no longer what should used for speech
      //alternative: get messages[] from the state and read the last ones with the bot ID
      //reasoning: response only includes on message, but the bot could've sent multiple
      this.sayDialog();
    }
  }

  waterfall = async () => {
    if (this.waterfallRunning) return;

    this.waterfallRunning = true;

    const { waterfallId } = this.state;
    const convoID = await this.getConversationID();
    console.log("[MainScreen] current conversation: " + convoID);

    pingWatermark(convoID, waterfallId).then(res => res.json())
    .then((result) => {
        if (result.watermark === null || result.activities === null) return;

        if (result.watermark !== waterfallId) {
          //we have an update...

          for (var activity of result.activities) {
            if (activity.text === null) continue;
            if (activity.from.id === null) continue;

            if (activity.from.id === "1") {
              //message came from bot!
              const message = activity.text;
              this.recordMessage(message, true);
            }
          }

          this.setState({waterfallId: result.watermark});
        }
        console.log("watermark result: " + JSON.stringify(result));
      },(error) => {
        console.log("watermark error: " + JSON.stringify(error));
      }
    );

    this.waterfallRunning = false;
  }

  getConversationID = async () => {
    const { conversationId } = this.state;
    if (conversationId !== null) return conversationId;

    return await startNewConversation().then(res => res.json())
    .then((result) => {
        console.log(result);
        if (result == null || result.conversationId === null) { return null; }
        this.setState({conversationId: result.conversationId});
        return result.conversationId;
      },(error) => {
        console.error(error);
      }
    )
  }

  setAvatarParameters = (source) => {
    if (source == null || source.expression == null) return;

    const angryScale = source.expression.angryScale;
    const sadScale = source.expression.sadScale;
    const surprisedScale = source.expression.surprisedScale;

    const state = source.state;
    const emotion = source.emotion;

    if (!angryScale || !sadScale || !surprisedScale || !state || !emotion) {
      console.log("ERROR: new actions from bot-framework are incomplete.");
      return; //incomplete
    }

    this.setState({avatarActions: {timestamp: new Date(), state: state, emotes: [emotion], expressions: {angry: angryScale, surprised: surprisedScale, sad: sadScale}}});
  }

  selectEmotion = (index) => {
    if (this.state.selectedEmotion !== index) {
      this.setState({selectedEmotion: index});
    }

    if (index === EMOTIONS_ENUM.loading) {
      this.setState({avatarActions: {timestamp: new Date(), state: 'Walking', emotes: ['ThumbsUp'], expressions: {angry: 0.0, surprised: 0.0, sad: 0.0}}});
    } else if (index === EMOTIONS_ENUM.happy) {
      this.setState({avatarActions: {timestamp: new Date(), state: 'Dance', emotes: ['Wave'], expressions: {angry: 0.0, surprised: 0.5, sad: 0.0}}});
    } else if (index === EMOTIONS_ENUM.sad) {
      this.setState({avatarActions: {timestamp: new Date(), state: 'Idle', emotes: ['No'], expressions: {angry: 0.0, surprised: 0.0, sad: 0.8}}});
    } else if (index === EMOTIONS_ENUM.neutral) {
      this.setState({avatarActions: {timestamp: new Date(), state: 'Idle', emotes: ['ThumbsUp'], expressions: {angry: 0.0, surprised: 0.0, sad: 0.0}}});
    }
  }

  publish = async (message) => {
    const convoID = await this.getConversationID();
    sendMessage(message, convoID);

    this.pubnubPublish(message);
  }

  pubnubPublish = (message) => {
    if (message === "") return;
    console.log("DEBUG");
    this.pubnub.publish({
        message: message,
        channel: 'amicus_global'
    });

    this.recordMessage(message, false);
  }

  publishToAzure = (message) => {
    console.log('PUBLISH TO AZURE');
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var xhr = new XMLHttpRequest();
    // const url = "https://webchat.botframework.com/embed/lucas-direct-line?t="+message;
    xhr.open('GET', "https://webchat.botframework.com/api/tokens", true);
    xhr.setRequestHeader('Authorization', 'BotConnector ' + 'cpnLitsCRbc.w0Wq-dgG6yVfMi24TNoicpM7EMRt3f8IFlD6Hg7fMx0');
    xhr.send();
    console.log (xhr.responseText);
    function processRequest(e) {
      if (xhr.readyState === 4  && xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        document.getElementById("chat").src="https://webchat.botframework.com/embed/lucas-direct-line?t="+response
      }
    }
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
      <div className="flex flex-col h-full bg-transparent text-grey-lighter">
        <div className="flex flex-col h-auto my-auto">
          <ThreeAvatarComponent actions={this.state.avatarActions}/>
          <div className="flex flex-col mx-auto p-2" style={{width: '40rem'}}>
            {/*<AvatarComponent emotion={selectedEmotion}/>*/}
            {/*<div className="h-5"/>*/}

            {this.viewIntro()}
            <div className="h-5"/>

            {this.viewHistory()}
            <MessageChatComponent messages={messages}/>
            <div className="h-5"/>

            <RecordComponent onPublish={(msg) => {
              console.log("RECORDING");
              this.publish(msg);
            }}/>

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

  viewStateButtons = () => {

    const { selectedEmotion } = this.state;

    const globalClassName = " font-bold py-2 px-4 rounded mt-2";
    const selectedClassName = " bg-red hover:bg-red-dark text-white" + globalClassName;
    const neutralClassName = " bg-grey hover:bg-grey-dark text-black" + globalClassName;

    return (
      <div className="absolute pin-t pin-l m-3 mt-5 text-center">
        <div className="flex flex-col">
          <div>Simulate</div>
          <button className={selectedEmotion === EMOTIONS_ENUM.happy ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.happy)}>
            Happy
          </button>
          <button className={selectedEmotion === EMOTIONS_ENUM.sad ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.sad)}>
            Sad
          </button>
          <button className={selectedEmotion === EMOTIONS_ENUM.neutral ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.neutral)}>
            Neutral
          </button>
        </div>
      </div>
    );
  }

}

export default MainScreen;
