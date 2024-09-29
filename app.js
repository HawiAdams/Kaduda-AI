const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const twilio = require('twilio');
const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('./path_to_generated_idl'); // Update this with your generated IDL path

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;  // Use environment variables
const authToken = process.env.TWILIO_AUTH_TOKEN;    // Use environment variables
const twilioClient = twilio(accountSid, authToken);

// OpenAI configuration
const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY  // Use environment variables
}));

// ICP Canister configuration
const agent = new HttpAgent({ host: 'https://ic0.app' });  // ICP Mainnet
const canisterId = process.env.CANISTER_ID;                // Update with your deployed canister ID
const offlineAiActor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Function to log messages on ICP canister
async function logMessageOnChain(message) {
    try {
        await offlineAiActor.addMessage(message);
        console.log("Message logged on-chain");
    } catch (error) {
        console.error("Error logging message on-chain: ", error);
    }
}

// Twilio SMS webhook to handle incoming messages
app.post('/sms', async (req, res) => {
    const receivedMessage = req.body.Body;

    try {
        // Get AI response from OpenAI
        const aiResponse = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: receivedMessage,
            max_tokens: 100
        });

        const replyMessage = aiResponse.data.choices[0].text.trim();

        // Send the AI-generated response via Twilio
        await twilioClient.messages.create({
            body: replyMessage,
            from: process.env.TWILIO_PHONE_NUMBER,  // Use environment variable
            to: req.body.From
        });

        console.log('Message sent successfully');

        // Log the received message on ICP canister
        await logMessageOnChain(receivedMessage);

        res.send(`<Response></Response>`);  // Twilio expects an empty response
    } catch (error) {
        console.error("Error handling SMS: ", error);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
