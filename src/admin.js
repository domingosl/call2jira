import React, {useEffect, useState, Fragment} from 'react'
import {AdminPage} from '@forge/ui'
import ForgeReconciler, {
    Text,
    Select,
    Form,
    Option,
    Heading,
    Inline,
    Stack,
    Tag,
    Radio,
    RadioGroup,
    Button,
    SectionMessage,
    TextArea,
    Image, Table, Head, Row, Cell, ModalDialog
} from '@forge/react'
import {requestJira, invoke} from '@forge/bridge'
import Br from './components/Br'
import FlowConfirmDialog from './components/FlowConfirmDialog'
import proxy from './services/proxy'
import { bugs as bugReportingMessageDefault } from './greeting-message-defaults'

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const App = () => {

    const [appIsLoading, setAppIsLoading] = useState(true);
    const [forceAddFlowView, setForceAddFlowView] = useState(false);
    const [flows, setFlows] = useState([]);

    const [countries, setCountries] = useState([]);
    const [places, setPlaces] = useState([]);
    const [numbers, setNumbers] = useState([]);

    const [country, setCountry] = useState(undefined);
    const [place, setPlace] = useState(undefined);
    const [number, setNumber] = useState(undefined);

    const [projects, setProjects] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [issueTypes, setIssueTypes] = useState([]);

    const [project, setProject] = useState(undefined);
    const [assignee, setAssignee] = useState(undefined);
    const [issueType, setIssueType] = useState(undefined);

    const [issueTypesIsLoading, setIssueTypesIsLoading] = useState(false);
    const [isFlowConfirmModalOpen, setIsFlowConfirmModalOpen] = useState(false);

    const [greetingMessage, setGreetingMessage] = useState("");

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onClose: () => {}
    });

    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        message: ""
    });

    const [extension, setExtension] = useState(undefined);


    const greetingMessageChange = (message) => {
        setGreetingMessage(message)
    }



    useEffect(async () => {

        const _flows = await invoke('getFlows');
        setFlows(_flows);

        const response = await proxy.get('numbers/countries');

        if(response.error)
            return setErrorModal({
                message: "The application servers are not available at the moment, please try again later",
                isOpen: true
            })

        setCountries(response.data);
        setProjects(await getProjects());
        setAssignees(await getAssignees());

        setAppIsLoading(false);


    }, []);

    const countrySelectChange = async (selected) => {
        const response = await proxy.get('numbers/countries/' + selected.value + '/places');
        setPlaces(response.data);
        setCountry(selected.value);
    }

    const placeSelectChange = async (selected) => {
        const response = await proxy.get('numbers?country=' + country + '&place=' + selected.value);
        setNumbers(response.data);
        setPlace(selected.value);
    }

    const numberSelectChange = selected => {
        setNumber(selected);
    }

    const getIssueType = async (projectId) => {
        const response = await requestJira('/rest/api/3/issuetype/project?projectId=' + projectId);
        return (await response.json()).filter(el => !el.subtask).map(el => ({
            id: el.id,
            name: el.name,
            iconUrl: el.iconUrl
        }));
    }

    const getProjects = async () => {
        const response = await requestJira('/rest/api/3/project/search');
        return (await response.json()).values.map(el => ({id: el.id, name: el.name, iconUrl: el.avatarUrls['48x48']}));
    }

    const getAssignees = async () => {
        const response = await requestJira('/rest/api/3/users/search');
        return (await response.json())
            .filter(assignee => assignee.accountType === 'atlassian' && assignee.active)
            .map(el => ({id: el.accountId, displayName: el.displayName, avatarUrl: el.avatarUrls['48x48']}));
    }

    const projectSelectChange = async selected => {
        setProject(selected);
        setIssueTypesIsLoading(true);
        setIssueTypes(await getIssueType(selected.value));
        setIssueTypesIsLoading(false);
    }

    const assigneeSelectChange = selected => {
        setAssignee(selected);
    }

    const issueTypeChange = selected => {
        const it = issueTypes.find(el => el.id === selected);
        setIssueType({name: it.name, id: it.id});
    }

    const purposeTypeChange = selected => {
        //TODO: Manage more use cases
        setGreetingMessage(selected.value === 'bugReporting' ? bugReportingMessageDefault : "")
    }

    const flowSave = async event => {

        if(event.message.length > 300) {
            console.log("TOO LONG")
            return false
        }

        const response = await invoke('getExtension', {numberId: event.phoneNumber.value});

        if (response.error) {
            //todo manage error 403
            return;
        }

        setExtension(response.number);

        await invoke('addFlow', {
            number,
            extension: response.number,
            project,
            assignee,
            issueType,
            message: event.message
        });

        await refreshFlows();

        setForceAddFlowView(false);
        setIsFlowConfirmModalOpen(true);


    }

    const refreshFlows = async () => {
        setFlows(await invoke('getFlows'));
    }

    const closeModal = () => {
        setIsFlowConfirmModalOpen(false);

        setCountry(undefined);
        setPlace(undefined);
        setProject(undefined);
        setNumber(undefined);
        setAssignee(undefined);
        setIssueType(undefined);

        setPlaces([]);
        setNumbers([]);
        setIssueTypes([]);
    }

    const deleteFlow = async (numberId, extension) => {

        setAppIsLoading(true);
        await invoke('deleteFlow', {numberId, extension});
        await refreshFlows();
        setAppIsLoading(false);
    }

    return (

        <>

            { errorModal.isOpen && (
                <ModalDialog header='Error' onClose={()=>setErrorModal({...errorModal, isOpen: false})} closeButtonText='Close'>
                    <Text>{errorModal.message}</Text>
                </ModalDialog>
            ) }

            { confirmModal.isOpen && (
            <ModalDialog header={confirmModal.title} onClose={()=>setConfirmModal({...confirmModal, isOpen: false})} closeButtonText='Cancel'>
                <Form submitButtonText={'Confirm'} onSubmit={async ()=> {
                    await confirmModal.next()
                    setConfirmModal({...confirmModal, isOpen: false})
                }}>
                    <Text>{confirmModal.message}</Text>
                </Form>
            </ModalDialog>
            ) }

            {isFlowConfirmModalOpen && (<FlowConfirmDialog number={number.label} extension={extension} project={project.label}
                                            onClose={closeModal}/>)}
            {appIsLoading && <Fragment><Image
                src="https://files.domingolupo.com/!kQFyVPniug"
                alt="loading..."
                size="small"
            /></Fragment>}

            {!appIsLoading && <Fragment>

                {flows.length > 0 && !forceAddFlowView && <>

                <Inline space="space.1000">
                    <Stack>
                        <Heading>Incoming call flows</Heading>
                    </Stack>

                    <Stack>
                        <Button
                            appearance="primary"
                            icon="add"
                            iconPosition="before"
                            onClick={() => {
                                setForceAddFlowView(true)
                            }}
                        >
                            Add new flow
                        </Button>
                    </Stack>
                </Inline>

                    <Br />

                    <Table>
                        <Head>
                            <Cell>
                                <Text>Phone number</Text>
                            </Cell>
                            <Cell>
                                <Text>Extension number</Text>
                            </Cell>
                            <Cell>
                                <Text>Project</Text>
                            </Cell>
                            <Cell>
                                <Text>Assignee</Text>
                            </Cell>
                            <Cell>
                                <Text>Options</Text>
                            </Cell>
                        </Head>
                        {flows.map(flow => (
                            <Row>
                                <Cell>
                                    <Tag
                                        color="blue-light">{flow.number.label}</Tag>
                                </Cell>
                                <Cell>
                                    <Text>{flow.extension}</Text>
                                </Cell>
                                <Cell>
                                    <Text>{flow.project.label}</Text>
                                </Cell>
                                <Cell>
                                    <Text>{flow?.assignee?.label}</Text>
                                </Cell>
                                <Cell>
                                    <Button appearance='subtle-link' onClick={
                                        ()=> {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Confirm flow deletion',
                                                message: 'Are you sure you want to delete your incoming call flow?',
                                                next: () => deleteFlow(flow.number.value, flow.extension)
                                            })

                                        }
                                    }>DELETE</Button>
                                    <Button appearance='link'>EDIT</Button>
                                </Cell>
                            </Row>
                        ))}
                    </Table>

                </>}

                {(flows.length === 0 || forceAddFlowView) && <>

                    <Inline space="space.1000">
                        <Stack>
                            <Heading>New Incoming call flow</Heading>
                        </Stack>

                        <Stack>
                            { flows.length > 0 && <Button
                                appearance="subtle"
                                icon="chevron-left"
                                iconPosition="before"
                                onClick={() => {
                                    setForceAddFlowView(false)
                                }}
                            >
                                Return to flows
                            </Button> }
                        </Stack>
                    </Inline>


                    <Br/>

                    <SectionMessage appearance="info">
                        <Text>
                            Select a phone number from our selection of local numbers. These numbers are <Tag
                            color="blue-light">shared</Tag>
                            among users, so when callers reach out, they will use an extension number that will be automatically
                            assigned to you
                            after the setup process. If you prefer an exclusive number with no extension please use a <Tag
                            color="red-light">premium</Tag>
                            number instead (coming soon).
                        </Text>
                    </SectionMessage>

                    <Br/>

                    <Form submitButtonText="Save" onSubmit={flowSave}>

                        <Select label="Which country do you typically receive calls from?" name="country" onChange={countrySelectChange} isRequired={true}>
                            {countries.map(country => <Option
                                label={country.flag + " " + capitalizeFirstLetter(country._id)} value={country._id}/>)}
                        </Select>
                        {country && <Select label="Select a city" name="place" onChange={placeSelectChange} isRequired={true}>
                            {places.map(place => <Option label={capitalizeFirstLetter(place)} value={place}/>)}
                        </Select>}
                        {place &&
                            <Select label="Phone number" name="phoneNumber" onChange={numberSelectChange} isRequired={true}>
                                {numbers.map(number => <Option label={number.identifier} value={number._id}/>)}
                            </Select>}


                        {number && <><Br/><Heading size='medium'>Calls will create tasks/tickets in</Heading>

                            <Select label="Project" name="project" onChange={projectSelectChange} isRequired={true}>
                                {projects.map(project => <Option label={project.name} value={project.id}/>)}
                            </Select>
                            {issueTypesIsLoading && <Fragment><Image
                                src="https://files.domingolupo.com/!kQFyVPniug"
                                alt="loading..."
                                size="small"
                            /></Fragment>}
                            {issueTypes.length > 0 && !issueTypesIsLoading && <RadioGroup
                                name="issueType"
                                label="Issue type"
                                isRequired={true} onChange={issueTypeChange}
                            >
                                {issueTypes.map(issueType => <Radio label={issueType.name} value={issueType.id}/>)}
                            </RadioGroup>}
                            <Select label="Assignee" name="assignee" onChange={assigneeSelectChange} isRequired={false}>
                                {assignees.map(assignee => <Option label={assignee.displayName} value={assignee.id}/>)}
                            </Select>

                            { issueType && <>
                                <Br/><Heading size='medium'>Purpose of the incoming calls</Heading>

                                <SectionMessage appearance="info">
                                    <Text>
                                        Defining the purpose of the call in advance helps the Call2Jira AI to correctly contextualize it.
                                    </Text>
                                    <Text>
                                        Use different flows for different purpose, and provide your customers with the correct extension for
                                        the correct use case.
                                    </Text>
                                </SectionMessage>

                                <Select label="Purpose type" name="purposeType" onChange={purposeTypeChange} isRequired={true}>
                                    <Option label="Bug reporting" value={'bugReporting'}/>
                                </Select>

                                <TextArea
                                    label="Greeting message"
                                    name="message"
                                    onChange={greetingMessageChange}
                                    isRequired={true}
                                    defaultValue={greetingMessage}
                                />
                                <Text>Characters left: {300 - greetingMessage.length}</Text>
                            </> }



                        </>
                        }

                    </Form>

                </>}


            </Fragment> }
        </>
    );
};

ForgeReconciler.render(
    <React.StrictMode>
        <AdminPage>
            <App/>
        </AdminPage>
    </React.StrictMode>
);