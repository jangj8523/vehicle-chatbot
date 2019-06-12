var jwt = require('jwt-simple');
var secret = 'kbXmws5yebisyIv_2XroEfWUyBL5e__k53w7KxOzmmXZCSrTxGqwsZJUocC3gFygAZsueFWGiotSVziOSZiFL02_QRAfxDQ81mMEtwe7h9-509jkKA3lGZDVEQiZIV4K0INa_XJKf1FMA9Nb1XdGCUtYp0LCpxTVAfwDb6MeI5qKJKAiIc9rNZEk-g9QxEdd-RZBK1rRz_YnUB555Gn8ZyE8k150XMA21wUdIPmwdAPjy1yan71pXMBzZEGXDWt3LsmJ0ndxfm6BdpgDpq_7YAbdjwUtGokRjX_1C7sTufrLETR4IgX2RNuBkNCKLl4RbwKwyyvc_SWmU42Uluzciw';

function retrieveEmotions(sentiment){
  var negativeEmotion = ["No"];
  var positiveEmotion = ["Jump", "ThumbsUp", "Punch"];
  var neutralEmotion = ["Wave", "Yes"];

  let emote = null;

  if (sentiment === 'neutral') {
    emote = neutralEmotion[Math.floor(Math.random() * neutralEmotion.length)];
  } else if (sentiment === 'negative') {
    emote = negativeEmotion[Math.floor(Math.random() * negativeEmotion.length)];
  } else {
    emote = positiveEmotion[Math.floor(Math.random() * positiveEmotion.length)];
  }
    //console.log("emote: ", emote);
  return emote;
}

function retrieveState(sentiment){
    var negativeStates = ['Idle', 'Death'];
    var positiveStates = ['Dance', 'Running'];
    var neutralStates = ['Standing', 'Sitting', 'Walking', null];

    let state = null;

    if (sentiment === 'neutral') {
      state = neutralStates[Math.floor(Math.random() * neutralStates.length)];
    } else if (sentiment === 'negative') {
      state = negativeStates[Math.floor(Math.random() * negativeStates.length)];
    } else {
      state = positiveStates[Math.floor(Math.random() * positiveStates.length)];
    }

    return state;
}

function retrieveExpression(sentiment){
    var angryScale = null;
    var surprisedScale = null;
    var sadScale = null;

    let expression = null;

    if (sentiment === 'neutral') {
      angryScale = (Math.random() * (0.850 - 0.3200) + 0.3200);
      surprisedScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
      sadScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
    } else if (sentiment === 'negative') {
      angryScale = (Math.random() * (0.010 - 0.0500) + 0.0500);
      surprisedScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
      sadScale = (Math.random() * (0.950 - 0.5200) + 0.5200);;
    } else {
      angryScale = (Math.random() * (0.650 - 0.4200) + 0.4200);
      surprisedScale = (Math.random() * (0.650 - 0.4200) + 0.4200);
      sadScale = (Math.random() * (0.320 - 0.1200) + 0.1200);
    }
    expression = {'angryScale':angryScale, 'surprisedScale':surprisedScale, 'sadScale':sadScale}
    return expression;
}


function modifyPitch(sentiment){
    var pitch = 0.0;
    var rate = 0.0;
    var volume = 0.0;
    if (sentiment === 'neutral') {
        volume = 1.0;
        rate = 1.0;
        pitch = 0.8;
    } else if (sentiment === 'negative') {
        volume = 0.7;
        rate = 0.65;
        pitch = 0.45;
    } else if (sentiment === 'positive') {
        volume = 1.0;
        rate = 1.15;
        pitch = 0.9;
    }
    return [volume, rate, pitch]
}


function amicusEncode(payload, emotionSpecification="neutral") {
  var response = "";
  var transition = "&";
  console.log("emotion in the encoder: ", emotion);
  var title = 'title=';
  var description = "description="
  var volume = "volume="
  var rate = "rate="
  var pitch = "pitch="
  var emotion = "emotion="
  var state = "state="
  var expression_angry = "expression_angry="
  var expression_surprise = "expression_surprise="
  var expression_sad = "expression_sad="


  response += title + "Amicus Message" + transition;
  response += description + payload + transition;

  var sound = modifyPitch(emotionSpecification)
  response += volume + sound[0] + transition;
  response += rate + sound[1] + transition;
  response += pitch + sound[2] + transition;

  var emote = retrieveEmotions(emotionSpecification);
  response += emotion + emote + transition;


  var action = retrieveState(emotionSpecification);
  response += state + action + transition;

  var express = retrieveExpression(emotionSpecification);
  response += expression_angry + express['angryScale'] + transition;
  response += expression_surprise + express['surprisedScale'] + transition;
  response += expression_sad + express['sadScale'];

  console.log("Before encoded: ", response);
  var token = jwt.encode(response, secret);

  console.log("ENCODED: ", token);
  return token;
}

module.exports = amicusEncode;
