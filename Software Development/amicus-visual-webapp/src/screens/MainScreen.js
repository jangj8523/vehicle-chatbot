import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';
import Modal from 'react-awesome-modal';
import { Message } from 'react-chat-ui';

import { amicusDecode } from '../managers/jwtManager';

import { startNewConversation, sendMessage, pingWatermark } from '../managers/networking/conversation';

import RecordComponent from '../components/RecordComponent';
//import AvatarComponent from '../components/AvatarComponent';
import ThreeAvatarComponent from '../components/ThreeAvatarComponent';
//import MessageChatComponent from '../components/MessageChatComponent';
import ConnectionComponent from '../components/ConnectionComponent';
import InformationComponent from '../components/InformationComponent';

import Digital from 'react-activity/lib/Digital';
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
    conversationId: null,
    errorMsg: null,
    online: false,
    connectionModalVisible: false,
    toggleRecordingCounter: 0,
    spokenText: '',
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
      //this.sayDialog();
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

        this.setState({online: true, errorMsg: null});
        if ((result.watermark !== waterfallId) && result.activities) {
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
        this.setState({online: false, errorMsg: 'no connection 🔌'});
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
    /*console.log('PUBLISH TO AZURE');
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
    }*/
  }

  recordMessage = (msg, isFromBot) => {
    const { messages } = this.state;
    let newMessages = messages;

    if (newMessages.length >= MESSAGE_LIMIT) { //4 max
      newMessages.splice(0,1);
    }
    //there needs to be a limit

    var decodedMessage = "";

    if (isFromBot) {
      //decode test
      decodedMessage = amicusDecode(msg);
      newMessages.push(new Message({ id: 1, message: decodedMessage["description"] }));
      console.log(decodedMessage);
      this.setState({avatarActions: {timestamp: new Date(), state: decodedMessage['state'], emotes: [decodedMessage['emotion']], expressions: {angry: decodedMessage["angry"], surprised: decodedMessage["surprise"], sad: decodedMessage["sad"]}}});
      this.setState({pitch: decodedMessage['pitch'], volume: decodedMessage['volume'], rate: decodedMessage['rate']});
      this.setState({toggleRecordingCounter: this.state.toggleRecordingCounter+1})

      this.say(decodedMessage["description"]);
    } else {
      newMessages.push(new Message({ id: isFromBot ? 1 : 0, message: msg }));
    }

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

  openConnectionSettings = () => {
    this.setState({connectionModalVisible : true});

    //var event = new Event('event_rain');
    //window.dispatchEvent(event);
  }

  render() {
    const { toggleRecordingCounter } = this.state;

    return (
      <div className="flex flex-col h-full bg-pitch-black text-grey-lighter">
        <div className="flex flex-col h-auto my-auto">
          <ThreeAvatarComponent actions={this.state.avatarActions}/>
          <div className="flex flex-col mx-auto" style={{width: '40rem'}}>

            {this.viewFeedback()}
            {this.viewHistory()}

            {/*<MessageChatComponent messages={messages}/>*/}

            <RecordComponent
              recorderCounter={toggleRecordingCounter}
              onPublish={(msg) => {
                  console.log("RECORDING");
                  this.publish(msg);
              }}
              reportSpokenText={(text) => {
                  const { spokenText } = this.state;
                  if (!text.startsWith(spokenText)) {
                    this.setState({messages: []});
                  }
                  this.setState({spokenText: text});
              }}/>

            <div className="mt-32">&nbsp;</div>
            {this.viewStateButtons()}
          </div>
        </div>
        {this.viewConnectionModal()}
        {this.viewInformation()}
      </div>
    );
  }

  viewConnectionModal = () => {

    this.closeModal = () => {
        this.setState({connectionModalVisible : false});
    };

    return (
      <Modal
          visible={this.state.connectionModalVisible}
          width="400"
          height="320"
          effect="fadeInUp"
          onClickAway={() => this.closeModal()} >
          <ConnectionComponent onPress={() => this.closeModal()}/>
      </Modal>
    );
  }

  viewInformation = () => {

    const globalClass = " text-white font-bold py-1 px-1 w-2 h-2 my-auto";
    const enabledClass = " bg-green hover:bg-green-dark" + globalClass;
    const disabledClass = " bg-grey-darker hover:bg-grey-darkest" + globalClass;

    const { online, errorMsg } = this.state;
    const currentClass = online ? enabledClass : disabledClass;

    return (
      <div className="absolute pin-b pin-l p-8 text-grey">
        <div className="flex flex-col ml-2 mr-2">
          <div className="font-light syncopate text-5xl">amicus</div>
          <div className="font-light text-base -mt-4">an intelligent bot-interface-as-a-servce (bAaS)</div>
          <div className="font-light text-base -mt-1">created with our friends over at BMW</div>
          <div className="bg-white h-1 mt-2 w-full" style={{height:'0.05em'}} />
          <div className="flex flex-row mt-3">
            <button className={currentClass}
              onClick={this.openConnectionSettings}>
            </button>
            <InformationComponent message={errorMsg}
              online={online}
              onClick={this.openConnectionSettings}/>
          </div>
        </div>
      </div>
    );
  }


  viewHistory = () => {
    //if (this.state.messages.length < MESSAGE_LIMIT) return;
    const { messages, spokenText } = this.state;

    var botMessage = null;
    var waitingForBot = false;
    if (messages) {

      let lastPayload = messages[messages.length - 1]; //last message
      if (lastPayload && (lastPayload.id === 0)) { //0 is a human message, 1 is a bot
        waitingForBot = true;
      } else {
        for (var i=messages.length-1; i>=0; i--) {
            let payload = messages[i];
            if (!payload || !payload.message || !payload.id) continue;

            if (payload.id === 0) break; //0 is a human message, 1 is a bot

            if (!botMessage) botMessage = "";
            if (botMessage.length > 0) botMessage += "\n";
            botMessage += payload.message;
        }
      }
    }

    let loaderColor = waitingForBot ? "#ef1c7f" : "#FFFFFF";;
    let textClass = botMessage ? "text-grey-darker" : "text-white";
    let botTextClass = (botMessage && (botMessage.length > 50)) ? "text-base" : "text-2xl";

    return (
      <div className="flex flex-col mb-2">

        { (spokenText.length > 0) ? <div className="flex flex-row w-2/3 -mt-5 mx-auto">
          <div className="flex w-auto mx-auto"></div>
          {!botMessage ? <Digital className="ml-2 mr-2 my-auto w-10 h-5" color={loaderColor} size={15}/> : <div/> }
          <div className="font-light text-base py-2 px-4 rounded bg-woodsmoke">
            <div className={textClass}>{spokenText.toLowerCase()}</div>
          </div>
        </div> : <div/>}

        {botMessage ? <div className="mt-3">
          <div className="text-white text-2xl w-2/3 text-left mx-auto" style={{'whiteSpace': 'pre-wrap'}}>
            <div className={botTextClass}>{botMessage}</div>
          </div>
        </div> : <div/>}
      </div>
    );
  }

  viewIntro = () => {
    return (
      <div className="absolute pin-b pin-l font-light mx-auto text-center">
        <div className="font-light syncopate text-5xl">amicus</div>
      </div>
    );
  }

  viewFeedback = () => {
    const { currentHint, hints, spokenText } = this.state;

    if (spokenText.length > 0) return;

    const hintText = hints[currentHint % hints.length];

    return (
      <div className="w-full -mt-5 text-center text-grey-dark">
        <div className="text-sm" key={hintText}>{hintText}</div>
      </div>
    );
  }

  viewStateButtons = () => {

    const { selectedEmotion } = this.state;

    const globalClassName = " font-bold py-1 px-4 rounded mt-2";
    const selectedClassName = " bg-red hover:bg-red-dark text-white" + globalClassName;
    const neutralClassName = " bg-grey hover:bg-grey-dark text-black" + globalClassName;

    return (
      <div className="absolute pin-b pin-r p-8 text-center">
        <div className="flex flex-col mr-2 ml-2">
          <div>simulate</div>
          <button className={selectedEmotion === EMOTIONS_ENUM.happy ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.happy)}>
            happy
          </button>
          <button className={selectedEmotion === EMOTIONS_ENUM.sad ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.sad)}>
            sad
          </button>
          <button className={selectedEmotion === EMOTIONS_ENUM.neutral ? selectedClassName : neutralClassName}
            onClick={() => this.selectEmotion(EMOTIONS_ENUM.neutral)}>
            neutral
          </button>
        </div>
      </div>
    );
  }

}

export default MainScreen;
