

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
                if (step.context.activity.type === 'message') {
                    console.log('hi');
                }
                // step.context.activity.text = 'There is a snake';
                // step.context.activity.speak = 'There is a snake';
                var windowDoor = step.options.entities[0].entity;
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

                const promptOptions = {
                    prompt: `Sure, ` + step.values.activity + ` ` +  step.values.windowDoor + ` it is. How far do you want it down?`,
                    choices: ["All the way down", "Half way", "All the way up"]
                };

                return await step.prompt('choicePrompt', promptOptions);
            },
            async function (step) {
                // Save the room number and "sign off".
                step.values.activity = step.result;
                step.values.conversation.push(step.result);
                var windowDoor = step.values.windowDoor;

                var verb = "pull";
                if (step.result.value == "All the way down") {
                    verb = "close";
                }  
                await step.context.sendActivity(`Great! I can ` + verb + ` the ${windowDoor} ` + ` ${step.result.value}`);

                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }
        ]));
    }

    


}

module.exports.ControlCarFeature = ControlCarFeature;
