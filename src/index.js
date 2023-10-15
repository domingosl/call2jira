import api, {webTrigger, fetch, storage, properties, route} from "@forge/api";
import Resolver from '@forge/resolver';
import { resolve, badRequest, forbidden } from "./helpers/http";
import { newIssue, getIssue, addTxtAttachment, addComment } from './services/issues';
import config from './config';
import proxy from "./services/proxy";
import { bugSummary, moreInfoResponseSummary, moreInfoRequestSummary } from "./services/ai";

const resolver = new Resolver();



export async function handleWebTrigger(req) {

    const data = JSON.parse(req.body);
    let flow;

    flow = await getFlow(data.payload.numberId, data.payload.extension);
    if(!flow) return forbidden('Flow not found!');

    if(data.cmd === 'getFlow') {
        return resolve(flow);
    }
    else if(data.cmd === 'newTranscription') {


        if(!data.payload.issueId) {

            const ticketFromAi = JSON.parse(await bugSummary(data.payload.text));

            const issue = await newIssue(
                flow.project.value,
                flow.issueType.id,
                flow?.assignee?.value ? flow?.assignee?.value : undefined,
                ticketFromAi.title,
                ticketFromAi.description
            );

            await addTxtAttachment(issue.id, data.payload.text, "phone-call-transcription-" + new Date().getTime());

            await properties.onJiraIssue(issue.id).set("c2jData", {
                number: flow.number,
                extension: flow.extension,
                callerNumber: data.payload.callerNumber,
                callerCountry: data.payload.callerCountry
            })
        }
        else {
            const summary = await moreInfoResponseSummary(data.payload.text);
            await addComment(data.payload.issueId, summary);
        }

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

resolver.define('makeCall', async ({payload}) => {

    const issueId = payload.context?.extension?.issue?.id;
    if(!issueId)
        return { error: 'No issue ID found!'}

    const issue = await getIssue(issueId);

    payload.message = await moreInfoRequestSummary(issue.fields.summary, payload.message);

    const c2jData = await properties.onJiraIssue(payload.context.extension.issue.id).get("c2jData");

    if(!c2jData)
        return { error: 'The issue was not created from a phone call' }

    await proxy.post('outgoing-call/make', {
        ...payload,
        ...c2jData,
        issueKey: issue.key,
        webhook: await webTrigger.getUrl("call2jira-webtrigger-key")
    })

    await addComment(issueId,
        "A request for more information has been queued. " +
        "A call will be made soon to " + c2jData.callerNumber + ". " +
        "Please wait for an update here in the comments." )

});

resolver.define('test', async () => {


    //return;
    const flows = await getAllFlows();
    const flow = flows[0];
    const issue = await newIssue(flow.project.value,
        flow.issueType.id,
        flow?.assignee?.value ? flow?.assignee?.value : undefined,
        "Test title",
        "Test description", { caller: "+44123123123"});

    console.log("1", issue)

    await properties.onJiraIssue(issue.id).set("foo", 123)

    console.log("2", await getIssue(issue.id))


    //await addTxtAttachment(issue.id, "This is a file with \n a new line!", "phone-call-transcription-" + new Date().getTime());




})

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

        await fetch(config.proxyBaseURL + '/extensions/' + extension + '/free', {
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
};

resolver.define('getExtension', async ({context, payload}) => {

    const webhook = await webTrigger.getUrl("call2jira-webtrigger-key");
    let response;
    try {
        response = await fetch(config.proxyBaseURL + '/extensions', {
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

export const commentEventHandler = (payload) => {
    console.log("EV", payload.eventType, payload.issue.id, payload.comment);
}

export const handler = resolver.getDefinitions();