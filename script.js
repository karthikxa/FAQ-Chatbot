const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const clearBtn = document.getElementById('clear-chat');

// Config
const GEMINI_API_KEY = 'AIzaSyAhHhPF82ZlT834O4HjM8YHB2TW8LHsm-w';
// Using v1 endpoint for better compatibility
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
// Fallback model if Flash fails
const FALLBACK_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

let isTyping = false;

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (message && !isTyping) {
        addMessage(message, 'user');
        userInput.value = '';
        getBotResponse(message);
    }
});

clearBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    localStorage.removeItem('chat_history');
    addMessage("Hello! I'm your FAQ assistant. How can I help you today?", 'bot');
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`, 'message-appear');

    const avatar = sender === 'bot' ? '🤖' : '👤';

    messageDiv.innerHTML = `
        <div class="avatar">${avatar}</div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    saveChatHistory();
}

function showTypingIndicator() {
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.classList.add('message', 'bot-message', 'message-appear');
    typingDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content typing">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function getBotResponse(userMessage) {
    showTypingIndicator();

    // Model fallback chain: Try most powerful/fastest first
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.0-pro'
    ];

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [{ text: "System prompt: You are a helpful FAQ assistant for a premium website. Keep your answers concise and friendly. Answer this: " + userMessage }]
        }]
    };

    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting Gemini model: ${modelName}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                removeTypingIndicator();

                if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    const botResponse = data.candidates[0].content.parts[0].text;
                    addMessage(botResponse, 'bot');
                    return; // Success!
                }
            } else {
                const errorData = await response.json();
                lastError = errorData.error?.message || response.statusText;
                console.warn(`Model ${modelName} failed: ${lastError}`);
            }
        } catch (e) {
            lastError = e.message;
            console.error(`Fetch error for ${modelName}:`, e);
        }
    }

    // If we get here, all models failed
    removeTypingIndicator();
    addMessage(`⚠️ **Error**: None of the available Gemini models could be reached. \n\n**Last Error:** ${lastError}\n\n**Troubleshooting:**\n1. Ensure your Gemini API Key is valid.\n2. Go to [Google AI Studio](https://aistudio.google.com/) and check if your key has access to these models.`, 'bot');
}

function saveChatHistory() {
    const history = [];
    document.querySelectorAll('.message').forEach(msg => {
        const text = msg.querySelector('p')?.innerText;
        const sender = msg.classList.contains('user-message') ? 'user' : 'bot';
        if (text) history.push({ text, sender });
    });
    localStorage.setItem('chat_history', JSON.stringify(history));
}

function loadChatHistory() {
    const history = localStorage.getItem('chat_history');
    if (history) {
        chatMessages.innerHTML = '';
        JSON.parse(history).forEach(msg => {
            addMessage(msg.text, msg.sender);
        });
    }
}
