import React, { Component } from 'react';
import PropTypes from 'prop-types';

import stringSimilarity from 'string-similarity';
import SpeechRecognition from 'react-speech-recognition';

import Spinner from 'react-activity/lib/Spinner';
import Digital from 'react-activity/lib/Digital';

import microphone from '../images/microphone.png';

import "../css/RecordComponent.css";

const SPEECH_WAIT_THRESHOLD = 2000;
const TRIGGER_WORDS = ["amicus", "ami", "bmw", "joy"];

class RecordComponent extends Component {

  state = {
    isListening: false,
    speechTimerShown: false,
  }

  constructor(props) {
    super(props);
    this.timeoutRef = null;
  }

  componentWillMount() {
    const { startListening, resetTranscript, browserSupportsSpeechRecognition } = this.props;
    if (browserSupportsSpeechRecognition) {
      console.log("[MainScreen] Browser supports speech recognition");
      resetTranscript();
      startListening();
    }
  }

  componentDidUpdate(prevProps, prevState){
    if (this.props.transcript !== prevProps.transcript) {
      const { transcript } = this.props;
      console.log("[componentDidUpdate] transcript delta: " + transcript);
      //console.log(stringSimilarity.compareTwoStrings(transcript, triggerPhrase));
      if (this.isTriggerValid(transcript)) {
        console.log("[componentDidUpdate] Amicus recognized");
        this.startListeningAPI();
      }

      this.startSpeechTimer(() => {
        this.sendPendingMessage();
        this.stopListeningAPI();
      });
    }

  }

  sendPendingMessage = () => {
    const { transcript, listening, resetTranscript } = this.props;
    if (!listening) return; /*if the browser is listening */
    if (transcript === "") return;

    if (this.props.onPublish && this.state.isListening) { /*if AMICUS is listening */
      this.props.onPublish(transcript);
    }

    resetTranscript();
  }

  startSpeechTimer = (callback) => {
    this.setState({speechTimerShown: true});

    if (this.timeoutRef !== null) {
      clearTimeout(this.timeoutRef);
    }
    this.timeoutRef = setTimeout(() => {
      this.setState({speechTimerShown: false});
      callback();
    }, SPEECH_WAIT_THRESHOLD);
  }

  isTriggerValid = (message) => {
    let splitMsg = message.split(" ");
    let lastWord = splitMsg[splitMsg.length-1].toLowerCase();

    for (var trigger of TRIGGER_WORDS) {
      if (stringSimilarity.compareTwoStrings(lastWord, trigger) >= 0.60) {
        return true;
      }
    }

    return false;
  }

  toggleListeningAPI = () => {
    const { resetTranscript } = this.props;
    this.setState({isListening: !this.state.isListening});
    resetTranscript();
  }

  startListeningAPI = () => {
    const { isListening } = this.state;
    if (isListening) return;

    const { resetTranscript } = this.props;
    this.setState({isListening: true});
    //this.startBrowserRecording();
    resetTranscript();
  }

  stopListeningAPI = () => {
    const { isListening } = this.state;
    if (!isListening) return;

    const { resetTranscript } = this.props;
    this.setState({isListening: false});
    //this.stopBrowserRecording();
    resetTranscript();
  }

  /*stopBrowserRecording = () => {
    const { stopListening, resetTranscript, listening, browserSupportsSpeechRecognition } = this.props;
    if (!browserSupportsSpeechRecognition) return;

    if (listening) {
      resetTranscript();
      stopListening();
    }
  }

  startBrowserRecording = () => {
    const { startListening, resetTranscript, listening, browserSupportsSpeechRecognition } = this.props;
    if (!browserSupportsSpeechRecognition) return;

    if (!listening) {
      resetTranscript();
      startListening();
    }
  }*/
  
  toggleBrowserRecording = () => {
      const { startListening, stopListening, resetTranscript, listening, browserSupportsSpeechRecognition } = this.props;
      if (!browserSupportsSpeechRecognition) return;
      resetTranscript();

      if (!listening) {
        startListening();
      } else {
        stopListening();
      }
  }

  render() {
    const { isListening } = this.state;

    return (
      <div>
        {this.viewSpokenText()}
        <div className="h-5"/>
        <div className="w-full text-center text-grey-dark">
          <button className="flex flex-col mx-auto relative bg-grey-light hover:bg-grey-dark w-16 h-16 rounded-full"
                  onClick={() => {this.toggleListeningAPI()}}>
            <img src={microphone} alt="Mic" className="z-10 absolute pin-l pin-r pin-b pin-t w-16 h-16 p-2"/>
            {/*!listening && <Sentry className="z-0 w-16 h-16" color="#FFFFFF" size={30}/>*/}
            {isListening && <Spinner className="z-0" color="#FFFFFF" size={47}/>}
          </button>
        </div>
        {this.viewDebug()}
      </div>
    );
  }

  viewSpokenText = () => {
    const { isListening } = this.state;
    const { transcript/*, listening */} = this.props; /*ignore listening from API*/
    if (!isListening || transcript === "") return;

    return (
      <div className="flex flex-col w-64 text-white text-center text-md mx-auto mt-3 py-2 px-4 rounded bg-woodsmoke">
        <div>{transcript}</div>
        <div className="flex flex-row mx-auto text-sm">
          {this.viewCountDown()}
          <div className="text-grey-dark">sending...</div>
        </div>

        {/*!browserSupportsSpeechRecognition && <div>No support</div>*/}
        {/*browserSupportsSpeechRecognition && <div>Support</div>*/}
      </div>
    );
  }

  viewCountDown = () => {
    const { speechTimerShown } = this.state;
    if (!speechTimerShown) return;

    return (
      <Digital className="mt-1 mr-2" color="#FFFFFF" size={13}/>
    );
  }

  viewDebug = () => {

    const globalClass = " text-white font-bold py-2 px-2 rounded-full";
    const enabledClass = " bg-red hover:bg-red-dark" + globalClass;
    const disabledClass = " bg-grey-darker hover:bg-grey-darkest" + globalClass;

    const { listening } = this.props;
    const currentClass = listening ? enabledClass : disabledClass;

    return (
      <div className="absolute pin-b pin-r m-3 text-grey text-center">
        <div className="flex flex-col">
          <button className={currentClass}
            onClick={this.toggleBrowserRecording}>
          </button>
          {/*<button className="bg-blue hover:bg-blue-dark text-white font-bold mt-3 py-2 px-4 rounded"
            onClick={this.sendPendingMessage}>
            Debug Send
          </button>*/}
        </div>
      </div>
    );
  }

}

RecordComponent.propTypes = {
  // Props injected by SpeechRecognition
  onPublish: PropTypes.func,
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
};

const options = { autoStart: false };
export default SpeechRecognition(options)(RecordComponent);
