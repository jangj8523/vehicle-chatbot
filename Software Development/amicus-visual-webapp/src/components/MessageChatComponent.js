import React, { Component } from 'react';
import { ChatFeed, Message } from 'react-chat-ui';
import PropTypes from 'prop-types';

class MessageChatComponent extends Component {

  state = {
    is_typing: false,
  }

  constructor(props) {
    super(props);

  }

  render() {

    return (
      <div>
        <ChatFeed
          messages={this.props.messages} // Boolean: list of message objects
          isTyping={this.state.is_typing} // Boolean: is the recipient typing
          hasInputField={false} // Boolean: use our input, or use your own
          bubblesCentered={true} //Boolean should the bubbles be centered in the feed?
          // JSON: Custom bubble styles
          bubbleStyles={
            {
              text: {
                fontSize: 14,
                color: '#ffffff',
              },
              chatbubble: {
                borderRadius: 15,
                padding: 10
              }
            }
          }
        />
      </div>
    );
  }

}

MessageChatComponent.propTypes = {
  messages: PropTypes.array,
};


export default MessageChatComponent;
