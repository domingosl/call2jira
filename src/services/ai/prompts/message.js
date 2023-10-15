export default (text) => {

    const tpl = `A client just called our company phone number and left a message. We will provide you a 
    transcription of the message. Your job is to remove any rambling, and create a clear, concise summary.

    Transcription of the client's message:
        {{text}}`

    return tpl.replace('{{text}}', text);

}