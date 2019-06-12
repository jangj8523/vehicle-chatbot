import { KEY_BASE_URL, BASE_URL } from '../../constants';

export function getCallURL() {
  let url = sessionStorage.getItem(KEY_BASE_URL);
  if (url == null) {
    url = BASE_URL;
    sessionStorage.setItem(KEY_BASE_URL, url);
  }

  return url;
}

export function setCallURL(url) {
  sessionStorage.setItem(KEY_BASE_URL, url);
}

export function post(endpoint, body) {

  let url = getCallURL();
  return fetch(`${url}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
    })
}

export function get(endpoint) {

  let url = getCallURL();
  return fetch(`${url}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
}
