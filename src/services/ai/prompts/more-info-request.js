export default (issueTitle, text) => {

    const tpl = `A client opened a Jira ticket with us, with the title "{{issueTitle}}". 
    A programmer from our company working on the ticket read it and have some questions or doubts 
    about such ticket. Here's what the programmer said: {{text}}

    Given what has been written by the programmer, and the context given by the ticket title, your 
    job is to formulate in less than 200 characters a question for the client in simple terms 
    considering that the client might not be very tech savvy. Your question will be read by 
     a robocaller and because of it, it should end up with the phrase "leave your answer after 
     the beep, you have a maximum of 2 minutes and when you are finish please end the call"`

    return tpl.replace('{{issueTitle}}', issueTitle).replace('{{text}}', text);

}