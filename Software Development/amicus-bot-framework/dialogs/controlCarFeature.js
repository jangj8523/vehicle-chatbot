

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');
const amicusEncode = require('../util/jwtManager.js');


class ControlCarFeature  extends ComponentDialog {



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

                var windowDoor = "";
                if (step.options.entities[0].entity.includes("open") || (step.options.query.includes("down") && step.options.entities[0].entity.includes("down"))) {
                    step.values.verb = "open";
                    windowDoor = step.options.entities[1].entity;
                } else {
                    step.values.verb = "close";
                    windowDoor = step.options.entities[1].entity;
                }

                var windowDoor = step.options.entities[1].entity;

                step.values.windowDoor = windowDoor;

                var response = `Ok, there are multiple "` + windowDoor + `". Which one are you referring to? `
                response += "Driver's seat, " + "Front seat, " +  "Back left, " +  "Back right?"

                let encodedAmicus = amicusEncode(response, "neutral");
                return await step.prompt('textPrompt', encodedAmicus);
            },
            async function (step) {
                // Save the name and prompt for the room number.
                step.values.activity = step.context.activity.text.toLowerCase();
                step.values.conversation.push(step.context.activity.text);
                var half = "half way";
                var open = "all the way";

                if (step.values.windowDoor === "door") {
                    return await step.next([]);
                }

                var promptChoiceA = open;
                var promptChoiceB = half;


                var response = `Sure, ` + step.values.activity + ` ` +  step.values.windowDoor + ` it is. How much should we ` + step.values.verb + ` it? `;
                response += promptChoiceA + ", or " + promptChoiceB + "?";
                let encodedAmicus = amicusEncode(response, "neutral");
                return await step.prompt('textPrompt', encodedAmicus);
            },

            async function (step) {
                // Save the room number and "sign off".

                if (step.values.windowDoor === "window") {
                    step.values.activity = step.context.activity.text;
                    step.values.conversation.push(step.context.activity.text);
                }
                var windowDoor = step.values.windowDoor;
                var verb = step.values.verb;
                var response = `Great! I can ` + verb + ` the ${windowDoor} `;

                if (step.values.windowDoor === "window") {
                    response += `on the` + ` ${step.context.activity.text}`;
                } else {
                    response += `on the` + ` ${step.values.activity}`;
                }

                // End the dialog, returning the user info.

                let encodedAmicus = amicusEncode(response, "neutral");
                await step.context.sendActivity(encodedAmicus);
                return await step.endDialog(step.values);
            }

        ]));
    }




}

module.exports.ControlCarFeature = ControlCarFeature;
