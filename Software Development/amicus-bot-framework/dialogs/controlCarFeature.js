

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


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


                if (step.options.entities[0].entity.includes("open") || step.options.entities[0].entity.includes("close")) {
                    step.values.verb = "open";
                } else {
                    step.values.verb = "close";
                }
                var windowDoor = step.options.entities[1].entity;

                step.values.windowDoor = windowDoor;
                const promptOptions = {
                    prompt: `Ok, there are multiple "` + windowDoor + `". Which one are you referring to?`,
                    choices: ["Driver's seat", "Front seat", "Back left", "Back right"]
                };
                return await step.prompt('choicePrompt', promptOptions);
            },
            async function (step) {
                // Save the name and prompt for the room number.
                step.values.activity = step.result.value;
                step.values.conversation.push(step.result.value);
                var close = "all the way up";
                var half = "half way";
                var open = "all the way down";

                if (step.values.windowDoor === "door") {
                    return await step.next([]);
                } 

                var promptChoiceA = open; 
                var promptChoiceB = half;
                if (step.values.verb.includes("close") || step.values.verb.includes("up")) {
                    promptChoiceA = close;
                }

                const promptOptions = {
                    prompt: `Sure, ` + step.values.activity + ` ` +  step.values.windowDoor + ` it is. How much should we ` + step.values.verb + ` it?`,
                    choices: [promptChoiceA, promptChoiceB]
                };

                return await step.prompt('choicePrompt', promptOptions);
            },
            async function (step) {
                // Save the room number and "sign off".

                if (step.values.windowDoor === "window") {
                    step.values.activity = step.result;
                    step.values.conversation.push(step.result);
                } 
                
                var windowDoor = step.values.windowDoor;

                var verb = step.values.verb;

                if (step.values.windowDoor === "window") {
                    await step.context.sendActivity(`Great! I can ` + verb + ` the ${windowDoor} ` + ` ${step.result.value}`);
                } else {
                    await step.context.sendActivity(`Great! I can ` + verb + ` the ${windowDoor} `);
                }

                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }
        ]));
    }

    


}

module.exports.ControlCarFeature = ControlCarFeature;
