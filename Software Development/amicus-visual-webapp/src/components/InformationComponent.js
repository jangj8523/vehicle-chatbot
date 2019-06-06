import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Dots from 'react-activity/lib/Dots';

class InformationComponent extends Component {

  render() {
    let { message } = this.props;

    let messageRender = null;
    if (message) {
      messageRender = (<div className="text-white">{message}</div>);
    } else {
      messageRender = <Dots color="#FFFFFF"/>
    }

    return (
      <div className="mr-2 hover:bg-grey-darker">
        <button className="text-color-white" onClick={this.props.onClick}>
        <div className="bg-grey-darker border-white border-2 border-solid pl-5 pr-5 pt-2 pb-2 rounded-lg" style={{backgroundColor: '#20496869'}}>
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
