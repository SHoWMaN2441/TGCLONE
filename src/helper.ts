import axios from "axios";
export function Request(url: string, method: string, data?: unknown) {
  return axios({
    baseURL: "https://fakeapi.platzi.com/en/rest/products",
    url: url,
    method: method,
    data: data,
  });
}
