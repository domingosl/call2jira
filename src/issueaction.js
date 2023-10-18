import { IssueAction } from "@forge/ui"
import ForgeReconciler, {Form, ModalDialog, Text, TextArea, Tag, Select, Option} from "@forge/react";
import React, {Fragment, useEffect, useState} from "react";
import {invoke, view } from '@forge/bridge';
import ct from 'countries-and-timezones'

const App = () => {

    const [isOpen, setOpen] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [c2jIssueData, setC2jIssueData] = useState(undefined)
    const [message, setMessage] = useState("")
    const [timeZones, setTimeZones] = useState(undefined)

    if (!isOpen) {
        return null;
    }
    useEffect(() => {

        setIsLoading(true)
        view.getContext().then(context => {
            invoke('isC2JIssue', { context }).then((res)=>{
                setC2jIssueData(res)

                if(!res.callerCountry) {
                    const allTz = ct.getAllTimezones()
                    let cleanTz = [];
                    Object.keys(allTz).forEach(key => cleanTz.push(allTz[key]))
                    setTimeZones(cleanTz)
                }
                else
                    setTimeZones(ct.getTimezonesForCountry(res.callerCountry))


                setIsLoading(false)
            })
        })

    }, []);


    const submit = async (formData) => {
        const response = await invoke('makeCall', {...formData, context: await view.getContext() });
        setOpen(false);
    }

    return (
        <>
            <ModalDialog header="Request information" onClose={() => setOpen(false)}>

                { isLoading && <Text>please wait...</Text> }
                { !c2jIssueData && !isLoading && <Text>This is was not generated using Call2Jira</Text> }
                { c2jIssueData && !isLoading && <Form onSubmit={submit} submitButtonText='Queue Call'>

                    <Text>
                        Try to be concise and clear about the necessary missing information or clarifications you need.
                        There is no need to reference the Issue, appropriate context will be given by the AI. Call2Jira will call
                        <Tag color="blue">{c2jIssueData.callerNumber}</Tag> and present your requests. The response will be added as a comment in this Issue.
                    </Text>

                    <Select label="Caller timezone" name="tz" onChange={()=>{}} isRequired={true}>
                        {timeZones.map(tz => <Option label={tz.name} value={tz.name}/>)}
                    </Select>

                    <TextArea label="Message" name="message" onChange={setMessage} isRequired={true}/>

                    <Text>Characters left: {300 - (message.length || 0)}</Text>
                </Form> }



            </ModalDialog>
        </>
    );
};


ForgeReconciler.render(
    <React.StrictMode>
        <IssueAction>
            <App/>
        </IssueAction>
    </React.StrictMode>
);