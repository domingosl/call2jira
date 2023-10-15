import { IssueAction } from "@forge/ui"
import ForgeReconciler, {Form, ModalDialog, Text, TextArea} from "@forge/react";
import React, {useEffect, useState} from "react";
import {invoke, view } from '@forge/bridge';


const App = () => {
    const [isOpen, setOpen] = useState(true)

    if (!isOpen) {
        return null;
    }
    useEffect(async ()=>{

    }, []);


    const submit = async (formData) => {
        const response = await invoke('makeCall', {...formData, context: await view.getContext() });
        setOpen(false);
    }

    return (
        <>
            <ModalDialog header="Request information" onClose={() => setOpen(false)}>

                <Form onSubmit={submit} submitButtonText='Queue Call'>
                    <Text>Call2Jira will call the originator of the issue and read your message. The response will be added as a comment.</Text>
                    <TextArea label="Message" name="message" />
                </Form>


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