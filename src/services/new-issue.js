import api, {route} from "@forge/api";

export default async (project, issueType, assignee, summary = "Issue from call", description)=>{

    const payload = {
        update: {},
        fields: {
            issuetype: {
                id: issueType
            },
            project: {
                id: project
            },
            assignee: {
                id: assignee
            },
            description: {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                "text": description,
                                "type": "text"
                            }
                        ]
                    }
                ]
            }
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