import axios from "axios";
export function Request(url: string, method: string, data?: unknown) {
  return axios({
    baseURL: "http://localhost:8000",
    url: url,
    method: method,
    data: data,
  });
}
