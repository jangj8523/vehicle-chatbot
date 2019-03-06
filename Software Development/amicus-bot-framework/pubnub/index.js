
const PubNub = require('pubnub');

class PubNubClient {

  constructor() {
    this.pubnub = new PubNub({
        publishKey : 'pub-c-08bc673e-b941-4909-9e97-3c388077baef',
        subscribeKey : 'sub-c-e9df644a-3b9d-11e9-9010-ca52b265d058'
    });

    this.pubnub.subscribe({ channels: ['amicus_global'] });

    this.publishSampleMessage = function() {
        console.log("Since we're publishing on subscribe connectEvent, we're sure we'll receive the following publish.");
        var publishConfig = {
            channel : "amicus_global",
            message : {
                title: "Test",
                description: "Message Description"
            }
        }
        pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
        })
    }

    this.pubnub.addListener({
      status: function(statusEvent) {
          if (statusEvent.category === "PNConnectedCategory") {
              this.publishSampleMessage();
          }
      },
      message: function(msg) {
          console.log(msg);
          console.log(msg.message.title);
          console.log(msg.message.description);
      },
      presence: function(presenceEvent) {
          // handle presence
      }
    })
  }

  publishSampleMessage() {
      console.log("Since we're publishing on subscribe connectEvent, we're sure we'll receive the following publish.");
      var publishConfig = {
          channel : "amicus_global",
          message : {
              title: "Test",
              description: "Message Description"
          }
      }
      pubnub.publish(publishConfig, function(status, response) {
          console.log(status, response);
      })
  }

}

module.exports.PubNubClient = PubNubClient;
