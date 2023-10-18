export default (text) => {

    const tpl = `A client just called our company phone number and left a message describing a problem they have with a 
     product we develop for them. We will provide you a transcription of the message. Your job is to remove any rambling, 
     eliminate information not related to the issue, and create a clear, concise summary. 
     This summary will be used to create a ticket for a developer, ensuring they have clear information to address the 
     issue effectively. Please stop and think about the best way to write the ticket based on the client's recording.

    Transcription of the client's message:
        {{text}}

    Your task is to generate a JSON format output containing a "title" key for the ticket and a "description" 
    key containing a clear and concise description of the issue, you must use markdown in the description of the issue
    to improve format and remark import parts.`

    return tpl.replace('{{text}}', text);

}