import ForgeUI, {render, Form, Text, TextArea, IssueAction, ModalDialog, useState, useEffect, useProductContext, Button} from '@forge/ui';
import proxy from "./services/proxy";
import { Alert, openModal } from "./components/Alert";


const submit = async formData => {
    console.log(formData);

    const response = await proxy.post('/outgoing-call', {});

    if(response.error)
        return openModal("oh oh!")

    console.log(response);


}

const App = () => {
    const [isOpen, setOpen] = useState(true)

    if (!isOpen) {
        return null;
    }
    useEffect(async ()=>{

    }, []);

    const context = useProductContext();

    return (
        <>
            <Alert />
            <ModalDialog header="Request information" onClose={() => setOpen(false)}>

                <Form onSubmit={submit} submitButtonText='Queue Call'>
                    <Text>Call2Jira will call the originator of the issue and read your message. The response will be added as a comment.</Text>
                    <TextArea label="Message" name="message" />
                </Form>


            </ModalDialog>
        </>
    );
};

export const handler = render(
    <IssueAction>
        <App/>
    </IssueAction>
);