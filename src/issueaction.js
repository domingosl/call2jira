import {IssueAction} from "@forge/ui"
import ForgeReconciler, {Form, ModalDialog, Text, TextArea, Tag, Select, Option, Button} from "@forge/react";
import React, {Fragment, useEffect, useState} from "react";
import {invoke, view} from '@forge/bridge';
import ct from 'countries-and-timezones'
import Br from './components/Br'

const App = () => {

    const [isOpen, setOpen] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [c2jIssueData, setC2jIssueData] = useState(undefined)
    const [message, setMessage] = useState("")
    const [timeZones, setTimeZones] = useState(undefined)
    const [utcOffset, setUtcOffset] = useState(undefined)

    if (!isOpen) {
        return null;
    }
    useEffect(() => {

        setIsLoading(true)
        view.getContext().then(context => {
            invoke('isC2JIssue', {context}).then((res) => {
                setC2jIssueData(res)

                let timezones;

                if (!res.callerCountry) {
                    const allTz = ct.getAllTimezones()
                    let cleanTz = [];
                    Object.keys(allTz).forEach(key => cleanTz.push(allTz[key]))
                    timezones = cleanTz
                } else
                    timezones = ct.getTimezonesForCountry(res.callerCountry)

                setTimeZones(timezones)

                if (timezones.length === 1)
                    setUtcOffset(timezones[0].utcOffset)


                setIsLoading(false)
            })
        })

    }, []);


    const submit = async (formData) => {
        const response = await invoke('makeCall', {...formData, utcOffset, context: await view.getContext()});
        setOpen(false);
    }

    return (
        <>
            <ModalDialog header="Request information" onClose={() => setOpen(false)}>

                {isLoading && <Text>please wait...</Text>}
                {!c2jIssueData && !isLoading && <Text>This is was not generated using Call2Jira</Text>}
                {c2jIssueData && !isLoading &&
                    <Form onSubmit={submit} submitButtonText='Queue Call'>

                        <Text>
                            Please be concise and clear when specifying the necessary
                            missing information or seeking clarifications. There is no need to
                            reference the issue; the AI will provide appropriate context to the user.
                            Call2Jira will dial <Tag color="blue">{c2jIssueData.callerNumber}</Tag> and present your
                            requests.
                            The response will be added as a comment in this issue.
                        </Text>

                        {timeZones.length > 1 ?
                            <Select label="Caller timezone" name="tz" onChange={value => {
                                setUtcOffset(value)
                            }} isRequired={true}>
                                {timeZones.map(tz => <Option label={tz.name} value={tz.utcOffset}/>)}
                            </Select>
                            : <Text>Caller's timezone has been automatically set: <Tag
                                color="teal-light">{timeZones[0].name}</Tag></Text>
                        }

                        <TextArea label="Message" name="message" onChange={setMessage} isRequired={true}/>

                        <Text>Characters left: {300 - (message.length || 0)}</Text>
                        <Br/>
                    </Form>}


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