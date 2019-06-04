

const { ActivityTypes } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

class ReserveRestaurant  extends ComponentDialog {

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
                // Clear the user information and prompt for the user's name.
                if (step.values.conversation == null){
                    step.values.conversation = []
                } 

                var dest_entity = step.options.entities[0].entity;
                const promptOptions = {
                    prompt: `Ok, here are the five restaurants you visited most often. Where would you like to go?`,
                    choices: ["Izakaya", "Pompous", "Yaoui", "Circles", "Nola"]
                };
                step.values.conversation.push(step.result);
                return await step.prompt('choicePrompt', promptOptions);
            },

            async function (step) {
                
                step.values.activity = step.result.value;
                step.values.conversation.push(step.result.value);
                await step.context.sendActivity(`Great! We will head over to "${step.result.value}!"`);


                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }

        ]));
    }




}

module.exports.ReserveRestaurant = ReserveRestaurant;

// async function (step) {
    //     // Clear the user information and prompt for the user's name.
    //     step.values.userInfo = {};
    //     // result.send("Might be nice to destress and enjoy your favorites!?");
    //     await step.context.sendActivity("Might be nice to destress and enjoy your favorites!?")
    //     const promptOptions = {
    //         prompt: `Here's a list. What about Rubiano’s, the Italian place from last week?`,
    //         choices: ["Rubiano’s", "Pompous", "Izakaya", "Nola", "Circles"]
    //     };
    //     return await step.prompt('choicePrompt', promptOptions);
    // }

    // async function (step) {
    //     // Save the name and prompt for the room number.
    //     step.values.userInfo.userName = step.result;
    //     return await step.prompt('textPrompt', `Hi ${step.result}. What would you like to do?`);
    // },
