import { fetch } from '@forge/api';
import config from "../config";

const request = async (method, endpoint, body) => {

    try {

        const response = await fetch(config.proxyBaseURL + '/' + endpoint, {
            headers: {
                'Content-Type': 'application/json'
            },
            method,
            body: body ? JSON.stringify(body) : undefined
        });

        return { ...(await response.json()), error: null };
    }
    catch (error) {
        return { error };
    }
}


export default {
    post: (endpoint, body) => {
        return request('POST', endpoint, body);
    },
    get: (endpoint) => {
        return request('GET', endpoint);
    }
}