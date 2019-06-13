

const { ActivityTypes } = require('botbuilder');
var geolocation = require('geolocation')
const apiKey = 'AIzaSyAuPYGjxn_FBJk2WMPsJ9wdd4Le42obkSU';
const googleMapsClient = require('@google/maps').createClient({
  key: apiKey
});
const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');
const amicusEncode = require('../util/jwtManager.js');


const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

class RequestNameDialog  extends ComponentDialog {

    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new ChoicePrompt('choicePrompt'));
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // var promptOptions = {
                //     prompt: `Ok, ` + step.context.activity.text  + `! Would you mind clarifying your name for me please?`,
                //     choices: ["Tara Padma Iyer", "Benjamin Hannel","Vikram Pattabi","Andrew Zhang", "Lily Liu"]
                // }
                // return await step.prompt('choicePrompt', promptOptions);

                var response = `Ok, ` + step.context.activity.text  + `! Is this correct? Yes or No?`;
                step.values.userName = step.context.activity.text;
                step.values.close = true;
                step.values.skip_intro = false;
                let encodedAmicus = amicusEncode(response, "neutral");
                return await step.prompt('textPrompt', encodedAmicus);
            },

            async function (step) {
                // step.values.userName = step.result.value.split(" ")[0];
                step.values.confirm = step.context.activity.text;
                if (step.values.confirm === 'no')  {
                    step.values.userName = null;
                    step.values.nameExists = false;
                } else {
                  var response = `Thank you, and welcome "${step.values.userName}!"`
                  step.values.nameExists = true;
                  let encodedAmicus = amicusEncode(response, "positive");
                  await step.context.sendActivity(encodedAmicus);
                }
              // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }

        ]));
    }




}

module.exports.RequestNameDialog = RequestNameDialog;

// async function (step) {
    //     // Clear the user information and prompt for the user's name.
    //     step.values.userInfo = {};
    //     // result.send("Might be nice to destress and enjoy your favorites!?");
    //     await step.context.sendActivity("It might be nice to destress and enjoy your favorites!?")
    //     const promptOptions = {
    //         prompt: `Here's a list of some local comfort food places. What about Rubiano’s, the Italian place from last week?`,
    //         choices: ["Rubiano’s", "Pompous", "Izakaya", "Nola", "Circles"]
    //     };
    //     return await step.prompt('choicePrompt', promptOptions);
    // }

    // async function (step) {
    //     // Save the name and prompt for the room number.
    //     step.values.userInfo.userName = step.result;
    //     return await step.prompt('textPrompt', `Hi ${step.result}. How can I help you?`);
    // },
