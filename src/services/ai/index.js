import {fetch} from "@forge/api";
import bugPrompt from "./prompts/bug";
import messagePrompt from "./prompts/message";
import moreInfoRequestPrompt from "./prompts/more-info-request";
import moreInfoResponsePrompt from "./prompts/more-info-response";


export async function bugSummary(text) {
    return summary(bugPrompt(text))
}

export async function messageSummary(text) {
    return summary(messagePrompt(text))
}

export async function moreInfoRequestSummary(issueTitle, text) {
    return summary(moreInfoRequestPrompt(issueTitle, text))
}

export async function moreInfoResponseSummary(text) {
    return summary(moreInfoResponsePrompt(text))
}

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
                content: text
            }]
        })

    });

    const data = await response.json();

    return data?.choices[0]?.message?.content;

}