

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');
const amicusEncode = require('../util/jwtManager.js');


class CheckWeatherDialog  extends ComponentDialog {



    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));
        this.addDialog(new ChoicePrompt('choicePrompt'));
        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // step.prompt('textPrompt', `Hi ${args}`);
                // Clear the user information and prompt for the user's name.
                // var list = step.options
                // var sentimentList = args.sentimentIntent;
                step.values.conversation = [];
                // if (step.options.sentiment > 0.5) {
                //     console.log("user is happy");
                // } else if (step.options.sentiment < 0.5) {
                //     console.log(`user is sad: ${step.options.sentiment}`);
                // } else {
                //     console.log(`user is neutral: ${step.options.sentiment}`);
                // }

                // step.context.activity.text = 'There is a snake';
                // step.context.activity.speak = 'There is a snake';
                step.values.location = null;
                step.values.time = null;
                step.values.skip = true;
                step.values.skip_intro = false;
                step.values.close = true;
                console.log(step);
                for (var i = 0; i < step._info.options.entities.length; i++) {
                  var type = step._info.options.entities[i].type;
                  var name = step._info.options.entities[i].entity;
                  if (type === 'location') {
                    step.values.location = name;
                  } else if (type === 'time') {
                    step.values.time = name;
                  }
                }
                console.log("location: ", step.values.location);
                console.log("time: ", step.values.time);
                var response = ""
                var encoded = ""
                if (step.values.time === null) {
                  response = "Which day of the weather would you like to know?";
                  encoded = amicusEncode(response, "neutral");
                  step.values.skip = false;
                  return await step.prompt('textPrompt', encoded);
                } else if (step.values.location === null) {
                  step.values.skip = false;
                  response = "Which location of the weather would you like to know?";
                  encoded = amicusEncode(response, "neutral");
                  return await step.prompt('textPrompt', encoded);
                }
                return await step.next([]);
            },
            async function (step) {
                // Save the name and prompt for the room number.
                console.log("SASDC: ", step);
                if (step._info.values.time === null) {
                  var userInput = step.context.activity.text.toLowerCase();
                  step._info.values.time = userInput;
                } else if (step._info.values.location === null) {
                  var userInput = step.context.activity.text.toLowerCase();
                  step._info.values.location = userInput;
                }



                var response = "The weather in " + step._info.values.location +  ", " + step._info.values.time + ", is Rainy (0.65 humidity and 25mm rain)."
                var encoded = amicusEncode(response, "neutral");
                await step.context.sendActivity(encoded);
                return await step.endDialog(step.values);
            }

        ]));
    }




}

module.exports.CheckWeatherDialog = CheckWeatherDialog;
