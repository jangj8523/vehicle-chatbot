import { BASE_URL } from '../../constants';

export function post(endpoint, body) {
  return fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body,
    })
}

export function get(endpoint) {
  return fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
}
