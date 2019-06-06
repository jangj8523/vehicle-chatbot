import React, { Component } from 'react';
import { getCallURL, setCallURL } from '../managers/networking/api';
import PropTypes from 'prop-types';

//import { KEY_BOT_URL } from '../constants';

import chains from '../images/chains.png';

class ConnectionComponent extends Component {

  state = {
    connectionUrl: '',
  }

  componentWillMount() {
    this.setState({connectionUrl: getCallURL()});
  }

  handleConnectionChange = (event) => {
    this.setState({connectionUrl: event.target.value});
  }

  handleConnectionSubmit = (event) => {
    event.preventDefault();
    const { connectionUrl } = this.state;
    if (connectionUrl !== "")
      setCallURL(connectionUrl);

    this.props.onPress();
  }

  render() {

    return (
      <div className="text-grey-darker p-4">
          <div className="flex flex-row">
            <h2>Bot Connection</h2>
            <div className="flex w-auto m-auto"/>
            <img src={chains} alt="Chains" className="mt-1 w-8 h-8"/>
          </div>
          <p>Amicus was designed to connect to an existing <a href="https://dev.botframework.com/">Bot Framework</a> instance. The easiest way to launch one is via the <a href="https://github.com/Microsoft/BotFramework-Emulator">emulator</a>, with active <a href="https://ngrok.com/">ngrok</a> forwarding.</p>

          <form onSubmit={this.handleConnectionSubmit}>
            <input className="flex w-full py-2 px-4 rounded bg-grey-light"
             type="text" placeholder="enter ngrok url" value={this.state.connectionUrl} onChange={this.handleConnectionChange}/>
            <input type="submit" value="Connect" className="flex mt-4 ml-auto py-2 px-4 rounded mt-2 bg-green hover:bg-green-darker text-white"/>
          </form>
      </div>
    );
  }

}

ConnectionComponent.propTypes = {
  onPress: PropTypes.func,
};

export default ConnectionComponent;
