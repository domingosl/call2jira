import api, {route} from "@forge/api";
const FormData = require('form-data');
import fnTranslate from "md-to-adf";


export const newIssue = async (project, issueType, assignee, summary = "Issue from call", description) => {

    const payload = {
        update: {},
        fields: {
            labels: [
                "call2jira"
            ],
            issuetype: {
                id: issueType
            },
            project: {
                id: project
            },
            assignee: {
                id: assignee
            },
            description: fnTranslate(description)
        }
    };

    if(summary)
        payload.fields.summary = summary;
    if(assignee)
        payload.fields.assignee = { id: assignee };

    return await (await api.asApp().requestJira(route`/rest/api/3/issue`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })).json();


}

export const getIssue = async (id) => {
    return await (await api.asApp().requestJira(route`/rest/api/3/issue/${id}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })).json();
}

export const addTxtAttachment = async (issueId, text, filename) => {


    const form = new FormData();

    form.append('file', Buffer.from(text), {filename: filename + '.txt'})

    return await (await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}/attachments`, {
        method: 'POST',
        headers: {
            'X-Atlassian-Token': 'nocheck',
            'Accept': 'application/json',
            'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`,
        },
        body: form.getBuffer()
    })).json();


}

export const addComment = async (issueId, comment) => {

    await api.asApp().requestJira(route`/rest/api/3/issue/${issueId}/comment`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "body": fnTranslate(comment)
        })
    })

}