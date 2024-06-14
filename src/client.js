import axios, {Axios} from "axios";

export default class Client extends Axios {
  constructor(baseUrl, apiKey, jwt) {
    super({
      ...axios.defaults,
      baseURL: baseUrl,
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${jwt}`,
      },
    });
  }
}
