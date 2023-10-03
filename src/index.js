import {webTrigger, fetch, storage} from "@forge/api";
import Resolver from '@forge/resolver';
import { resolve, badRequest, forbidden } from "./helpers/http";
import newIssue from './services/new-issue';

const resolver = new Resolver();

const proxyApiURL = 'https://call2jira-proxy.domingolupo.com';

async function summary(text) {


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.OPENAI_SECRET_KEY
        },
        method: 'POST',
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
                role: 'system',
                content: 'A client just called our company phone number a left a message describing ' +
                    'a problem it has with a product we develop for them. We will provide you ' +
                    'a transcription of the message. Your job is to remove rambling, remove any ' +
                    'information not related with the issue and create a concise summary that will be ' +
                    'use as a ticket for a developer that needs clear information.' +
                    'Stop and think the best way to write the ticket from the client\'s recording.'
            }, {
                role: 'user',
                content: text
            }]
        })

    });

    const data = await response.json();

    return data?.choices[0]?.message?.content;

}



export async function handleWebTrigger(req) {

    const data = JSON.parse(req.body);
    let flow;

    flow = await getFlow(data.payload.numberId, data.payload.extension);
    if(!flow) return forbidden('Flow not found!');

    if(data.cmd === 'getFlow') {
        return resolve(flow);
    }
    else if(data.cmd === 'newTranscription') {

        await newIssue(
            flow.project.value,
            flow.issueType.id,
            flow?.assignee?.value ? flow?.assignee?.value : undefined,
            "TODO",
            await summary(data.payload.text));

        return resolve();
    }

}


const getAllFlows = async () => {
    return (await storage.get("flows") || []);
}

const getFlow = async (numberId, extension) => {
    const flows = await storage.get("flows") || [];

    return flows.find(el => el.number.value === numberId && el.extension === extension);

}

resolver.define('getFlows', async () => {
    return getAllFlows();
});

resolver.define('addFlow', async ({payload}) => {
    await storage.set('flows', [...(await getAllFlows()), payload]);
});

resolver.define('deleteFlow', async ({payload}) => {
    const currentFlows = await getAllFlows();
    const toDelFlow = currentFlows.find(flow => flow.extension === payload.extension && flow.number.value === payload.numberId );
    await freeExtension(toDelFlow.number.value, payload.extension);
    await storage.set('flows', (currentFlows).filter(flow => flow.extension !== payload.extension && flow.number.value === payload.numberId ));
});

const freeExtension = async (numberId, extension) => {

    try {

        await fetch(proxyApiURL + '/extensions/' + extension + '/free', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numberId
            })
        });

        return true;

    } catch (error) {
        //TODO: Manage Error 403
        return {error};
    }
}

resolver.define('getExtension', async ({context, payload}) => {

    const webhook = await webTrigger.getUrl("call2jira-webtrigger-key");
    let response;
    try {
        response = await fetch(proxyApiURL + '/extensions', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numberId: payload.numberId,
                webhook
            })
        });
    } catch (error) {
        //TODO: Manage Error 403
        return {error};
    }

    return (await response.json()).data;

});


export const handler = resolver.getDefinitions();