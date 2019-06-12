var jwt = require('jwt-simple');
var secret = 'kbXmws5yebisyIv_2XroEfWUyBL5e__k53w7KxOzmmXZCSrTxGqwsZJUocC3gFygAZsueFWGiotSVziOSZiFL02_QRAfxDQ81mMEtwe7h9-509jkKA3lGZDVEQiZIV4K0INa_XJKf1FMA9Nb1XdGCUtYp0LCpxTVAfwDb6MeI5qKJKAiIc9rNZEk-g9QxEdd-RZBK1rRz_YnUB555Gn8ZyE8k150XMA21wUdIPmwdAPjy1yan71pXMBzZEGXDWt3LsmJ0ndxfm6BdpgDpq_7YAbdjwUtGokRjX_1C7sTufrLETR4IgX2RNuBkNCKLl4RbwKwyyvc_SWmU42Uluzciw';

export function amicusDecode(token) {
  var decoded = jwt.decode(token, secret);
  console.log("DECODER");
  var decodedList = decoded.split('&');
  // var title = 'title=';
  // var description = "description="
  // var volume = "volume="
  // var rate = "rate="
  // var pitch = "pitch="
  // var emotion = "emotion="
  // var state = "state="
  // var expression_angry = "expression_angry="
  // var expression_surprise = "expression_surprise="
  // var expression_sad = "expression_sad="

  console.log("parsed: ", decodedList);
  var titleValue = decodedList[0].split("=")[1]
  var descriptionValue = decodedList[1].split("=")[1]
  var volumeValue = decodedList[2].split("=")[1]
  var rateValue = decodedList[3].split("=")[1]
  var pitchValue = decodedList[4].split("=")[1]
  var emotionValue = decodedList[5].split("=")[1]
  var stateValue = decodedList[6].split("=")[1]
  var expression_angryValue = decodedList[7].split("=")[1]
  var expression_surpriseValue = decodedList[8].split("=")[1]
  var expression_sadValue = decodedList[9].split("=")[1]

  var outputMap = {}
  outputMap["title"] = titleValue;
  outputMap["description"] = descriptionValue;
  outputMap["volumeValue"] = volumeValue;
  outputMap["rate"] = rateValue;
  outputMap["pitch"] = pitchValue;
  outputMap["emotion"] = emotionValue;
  outputMap["state"] = stateValue;
  outputMap["angry"] = expression_angryValue;
  outputMap["surprise"] = expression_surpriseValue;
  outputMap["sad"] = expression_sadValue;
  console.log("original: ", decoded);

  console.log("output map: ", outputMap);
  // this.setState({response: msg.message.description, loading: false, pitch: msg.message.pitch, volume: msg.message.volume, rate: msg.message.rate, emotion: msg.message.emotion})


  return outputMap;
}
