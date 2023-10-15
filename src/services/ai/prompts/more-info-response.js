export default (text) => {

    const tpl = `We asked a client for more information about an issue. 
    Here's what the client said: "{{text}}". Your job is to remove any rambling from the response, 
    and create a clear, concise summary`

    return tpl.replace('{{text}}', text);

}