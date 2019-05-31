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

      const { isListening } = this.state;
      if (this.isTriggerValid(transcript) && !isListening) {
        console.log("[componentDidUpdate] Amicus recognized");
        console.log("[componentDidUpdate] transcript delta: " + transcript);
        
        this.startListeningAPI();
      } else {
        this.startSpeechTimer(() => {
          if(this.sendPendingMessage()) {
            this.stopListeningAPI();
          }
        });
      }
    }

  }

  sendPendingMessage = () => {
    const { transcript, listening, resetTranscript } = this.props;
    if (!listening) return false; /*if the browser is listening */
    if (transcript === "") return false;

    if (this.props.onPublish && this.state.isListening) { /*if AMICUS is listening */
      this.props.onPublish(transcript);
      resetTranscript();
      return true;
    }

    resetTranscript();
    return false;
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

  /* app listening */
  /* once you say "hey amicus," or press the speak button, amicus actually listens */
  toggleListeningAPI = () => {
    const { isListening } = this.state;
    if (!isListening) {
      this.startListeningAPI();
    } else {
      this.stopListeningAPI();
    }

    var event = new Event('keydown');
    document.dispatchEvent(event);
  }

  startListeningAPI = () => {
    const { isListening } = this.state;
    if (isListening) return;

    const { resetTranscript } = this.props;
    this.setState({isListening: true});
    this.startBrowserRecording();
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
  /* [END] app listening */

  /* browser listening */
  /* chrome must always be listening in order to pick-up a "hey amicus" phrase. */
  stopBrowserRecording = () => {
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
  }

  toggleBrowserRecording = () => {
      const { listening, browserSupportsSpeechRecognition } = this.props;
      if (!browserSupportsSpeechRecognition) return;

      if (!listening) {
        this.startBrowserRecording();
      } else {
        this.stopBrowserRecording();
      }
  }
  /* [END] browser listening */

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
