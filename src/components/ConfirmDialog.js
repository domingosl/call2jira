import React from "react";
import {ModalDialog, SectionMessage, StatusLozenge, Text} from "@forge/react";

const ConfirmDialog = (props) => {

    return <ModalDialog header="" onClose={props.onClose} closeButtonText='Ok'>


        <SectionMessage title="Your flow has been setup!" appearance="confirmation"></SectionMessage>
        <Text>You phone number is <StatusLozenge appearance="inprogress">{props.number}</StatusLozenge></Text>
        <Text>And your extension is <StatusLozenge appearance="inprogress">{props.extension}</StatusLozenge></Text>

        <Text>Calling that number and using that extension your clients can describe and/or report issues.
            Call2Jira AI will listen, convert the speech to text, eliminate rambling a create a concise ticket on your project:
            <StatusLozenge appearance="inprogress">{props.project}</StatusLozenge></Text>

    </ModalDialog>

}

export default ConfirmDialog;