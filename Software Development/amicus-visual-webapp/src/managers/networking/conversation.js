import { get, post } from './api';
import { KEY_CONVO, KEY_CONVO_ID } from '../../constants';

export function clearAll() {
  sessionStorage.clear();
}

export function getConversationID() {
  if (sessionStorage.getItem(KEY_CONVO) !== null) {
    console.log("[startConversation] returning from cache.");
    return sessionStorage.getItem(KEY_CONVO_ID);
  }

  return post("/v3/directline/conversations"/*, JSON.stringify(msg)*/).then(res => res.json())
  .then((result) => {
      console.log(result);
      if (result == null || result.conversationId === null) { return null; }
      sessionStorage.setItem(KEY_CONVO, result);
      sessionStorage.setItem(KEY_CONVO_ID, result.conversationId);
      return result.conversationId;
    },(error) => {
      console.log(error);
    }
  );
}


export function startConversation() {
  if (sessionStorage.getItem(KEY_CONVO) !== null) {
    console.log("[startConversation] returning from cache.");
    return new Promise(function(resolve, reject) {
      resolve(sessionStorage.getItem(KEY_CONVO));
    });
  }

  let response = post("/v3/directline/conversations"/*, JSON.stringify(msg)*/);
  if (response == null || response.conversationId === null) { return null; }

  sessionStorage.setItem(KEY_CONVO, response);
  return response;
}
