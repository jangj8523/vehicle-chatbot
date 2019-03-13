import React, { Component } from 'react';
import PropTypes from 'prop-types';

import stringSimilarity from 'string-similarity';
import SpeechRecognition from 'react-speech-recognition';

import Spinner from 'react-activity/lib/Spinner';

import microphone from '../images/microphone.png';

import "../css/RecordComponent.css";

class RecordComponent extends Component {

  state = {
    isListening: false,
    triggerPhrase: "amicus",
    speechTimerShown: false,
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
      const { triggerPhrase } = this.state;
      console.log("[componentDidUpdate] transcript delta: " + transcript);
      //console.log(stringSimilarity.compareTwoStrings(transcript, triggerPhrase));
      if (stringSimilarity.compareTwoStrings(transcript, triggerPhrase) >= 0.60) {
        console.log("[componentDidUpdate] Amicus recognized");
        this.startListeningAPI();
      }

      this.startSpeechTimer();
    }

  }

  debugSend = () => {
    const { transcript, listening, resetTranscript } = this.props;
    if (!listening) return; /*if the browser is listening */
    if (transcript === "") return;

    if (this.props.onPublish && this.state.isListening) { /*if AMICUS is listening */
      this.props.onPublish(transcript);
    }

    resetTranscript();
  }

  startSpeechTimer = () => {
    this.setState({speechTimerShown: true});

    setTimeout(() => {
      this.setState({speechTimerShown: false});
      this.debugSend();
    }, 3000);
  }

  toggleListeningAPI = () => {
    const { resetTranscript } = this.props;
    this.setState({isListening: !this.state.isListening});
    resetTranscript();
  }

  startListeningAPI = () => {
    const { resetTranscript } = this.props;
    this.setState({isListening: true});
    resetTranscript();
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
      <div className="flex flex-col text-white text-center mx-auto mt-3">
        <div>{transcript}</div>
        {this.viewCountDown()}

        {/*!browserSupportsSpeechRecognition && <div>No support</div>*/}
        {/*browserSupportsSpeechRecognition && <div>Support</div>*/}
      </div>
    );
  }

  viewCountDown = () => {
    const { speechTimerShown } = this.state;
    if (!speechTimerShown) return;

    return (
      <div id="countdown">
        <div id="countdown-number"></div>
        <svg>
          <circle r="13" cx="15" cy="15"></circle>
        </svg>
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

RecordComponent.propTypes = {
  // Props injected by SpeechRecognition
  onPublish: PropTypes.func,
  transcript: PropTypes.string,
  resetTranscript: PropTypes.func,
  browserSupportsSpeechRecognition: PropTypes.bool
};

const options = { autoStart: false };
export default SpeechRecognition(options)(RecordComponent);
