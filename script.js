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

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: "System prompt: You are a helpful FAQ assistant for a premium website. Keep your answers concise and friendly. Answer this: " + userMessage }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to Gemini API');
        }

        const data = await response.json();
        removeTypingIndicator();

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            const botResponse = data.candidates[0].content.parts[0].text;
            addMessage(botResponse, 'bot');
        } else {
            throw new Error("Invalid response format from Gemini");
        }

    } catch (error) {
        console.error('Chatbot API Error:', error);
        removeTypingIndicator();
        addMessage("⚠️ **Error**: " + error.message + ". \n\n**Troubleshooting:**\n1. Ensure your Google API Key is valid.\n2. Check if the Gemini API is enabled in your Google Cloud Console.", 'bot');
    }
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
