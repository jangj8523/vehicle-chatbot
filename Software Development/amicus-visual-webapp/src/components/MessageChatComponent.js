import React, { Component } from 'react';
import { ChatFeed } from 'react-chat-ui';
import PropTypes from 'prop-types';

class MessageChatComponent extends Component {

  state = {
    is_typing: false,
  }

  render() {

    return (
      <div>
        <ChatFeed
          messages={this.props.messages}
          isTyping={this.state.is_typing}
          hasInputField={false}
          bubblesCentered={true}
          bubbleStyles={
            {
              text: {
                fontSize: 14,
              },
              textRecipient: {
                fontSize: 14,
                color: '#100910',
              },
              chatbubble: {
                borderRadius: 10,
                padding: 10,
                marginTop: 5,
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
