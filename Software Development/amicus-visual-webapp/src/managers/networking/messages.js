import { get, post } from './api';

export function getMessages(sortAscending = false) {
  const sortMode = sortAscending ? "asc" : "desc";
  return get("/v1/api/messages?sort=" + sortMode);
}

export function saveMessage(msg) {
  return post("/v1/api/message/add", JSON.stringify(msg));
}
