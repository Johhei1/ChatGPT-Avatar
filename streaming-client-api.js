//node app.js on http://localhost:3000/

'use strict';
// Use your Azure OpenAI API key
const AZURE_OPENAI_API_KEY = '';

// Update the Azure OpenAI API endpoint
const AZURE_OPENAI_API_ENDPOINT = '';

// OpenAI API endpoint set up
async function fetchAzureOpenAIResponse(userMessage) {
  const response = await fetch(AZURE_OPENAI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      "api-key": `${AZURE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.7,
      max_tokens: 50
    }),
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI API request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

const originalVideoSrc = 'face2.mp4';
const newVideoSrc = 'face2.mp4';

const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');

// Set local video source for continuous looping
//talkVideo.src = originalVideoSrc; // Set the original video
//talkVideo.loop = true;

window.onload = function () {
    const talkVideo = document.getElementById('talk-video');
    const originalVideoSrc = 'face2.mp4'; // Update with your video source

    talkVideo.src = originalVideoSrc;
    talkVideo.setAttribute('autoplay', '');
    talkVideo.setAttribute('loop', '');

    talkVideo.addEventListener('canplay', function () {
        talkVideo.play()
            .then(() => {
                console.log('Video playback started successfully.');
            })
            .catch(error => {
                console.error('Error playing the video:', error);
            });
    });
};

// Function to play the new video
function playNewVideo() {
    talkVideo.pause();
    talkVideo.srcObject = undefined;
    talkVideo.src = newVideoSrc;
    talkVideo.loop = false;
    talkVideo.play();
}

// Function to play the idle video
function playIdleVideo() {
    talkVideo.pause();
    talkVideo.srcObject = undefined;
    talkVideo.src = originalVideoSrc;
    talkVideo.loop = true;
    talkVideo.play();
}

const recognition = new window.webkitSpeechRecognition(); // Create a speech recognition object
recognition.lang = 'en-US'; // Set the language for recognition, de-DE,en-US 

const microphoneButton = document.getElementById('microphone-button');

microphoneButton.addEventListener('click', toggleSpeechRecognition);

function toggleSpeechRecognition() {
    if (recognition && recognition.state === 'running') {
        recognition.stop();
        microphoneButton.textContent = 'Start Speaking';
    } else if (recognition && recognition.state !== 'running') {
        recognition.start();
        microphoneButton.textContent = 'Stop Speaking';
    }
}

// Event listener for when speech recognition ends
recognition.onend = function () {
    microphoneButton.textContent = 'Start Speaking';
};

recognition.onresult = async function (event) {
    const userSpeech = event.results[0][0].transcript;

    try {
        const aiResponse = await fetchAzureOpenAIResponse(userSpeech);

        // Display user's speech and AI's response in the chat box (for example)
        displayMessage('You', userSpeech);
        displayMessage('AI', aiResponse);

        // Use Speech SDK to speak the AI's response
        await speakText(aiResponse);
        playIdleVideo();

        //// Use ResponsiveVoice.js to speak AI's response, UK English Male, Deutsch Male
        //window.responsiveVoice.speak(aiResponse, 'UK English Female', {
        //        onstart: playNewVideo,
        //        onend: playIdleVideo
        //    });

    } catch (error) {
        console.error('Error fetching AI response:', error);
    }
};

// Function to display messages in the chat box (you may customize this according to your application)
function displayMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

const inputEnter = document.getElementById('user-input-field');
const chatBox = document.getElementById('chat-box');

// Function to initialize the Speech SDK synthesizer
function initializeSpeechSynthesizer() {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription('', '');

    // Change voice settings (example: en-US, Guy24KRUS)
    speechConfig.speechSynthesisVoiceName = "en-US-RyanMultilingualNeural"; // Modify this line with your preferred voice, en-US-JennyMultilingualNeural

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    return synthesizer;
}

// Function to speak text using the Speech SDK synthesizer
async function speakText(text) {
    const synthesizer = initializeSpeechSynthesizer();

    return new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result) {
                    console.log("Speech synthesis succeeded:", result);
                    resolve(result);
                } else {
                    reject(new Error("Speech synthesis failed."));
                }
            },
            (error) => {
                reject(error);
            }
        );
    });
}

inputEnter.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
        const userMessage = inputEnter.value.trim();

        try {
            const responseFromAzureOpenAI = await fetchAzureOpenAIResponse(userMessage);

            // Display user's message and AI's response in the chat box
            displayMessage('Me', userMessage);
            displayMessage('AI', responseFromAzureOpenAI);

            //// Use ResponsiveVoice.js to speak AI's response
            //window.responsiveVoice.speak(responseFromAzureOpenAI, 'UK English Female', {
            //    onstart: playNewVideo,
            //    onend: playIdleVideo
            //});

            // Use Speech SDK to speak the AI's response
            await speakText(responseFromAzureOpenAI);
            playIdleVideo();

        } catch (error) {
            console.error('Error fetching AI response:', error);
        }
    }
});

