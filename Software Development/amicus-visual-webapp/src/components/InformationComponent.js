import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dots from 'react-activity/lib/Dots';

class InformationComponent extends Component {

  render() {
    let { message, online } = this.props;

    let messageRender = null;
    if (message) {
      messageRender = (<div className="text-red">{message}</div>);
    } else if (!online) {
      messageRender = <Dots color="#FFFFFF"/>
    } else {
      messageRender = (<div className="text-green">connected</div>);
    }

    return (
      <div className="ml-2 hover:bg-grey-darker">
        <button className="text-color-white" onClick={this.props.onClick}>
        <div className="bg-grey-darker pl-2 pr-2 pt-1 pb-1 rounded-lg" style={{backgroundColor: '#20496869'}}>
          {messageRender}
        </div>
        </button>
      </div>
    );
  }

}


InformationComponent.propTypes = {
  onClick: PropTypes.func,
  message: PropTypes.string
};

export default InformationComponent;
