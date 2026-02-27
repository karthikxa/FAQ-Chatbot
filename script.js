const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const clearBtn = document.getElementById('clear-chat');

// Config
const OPENROUTER_API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-3.5-turbo'; // You can change this to any OpenRouter supported model

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
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.href, // Required by OpenRouter
                'X-Title': 'Premium FAQ Chatbot', // Optional but good practice
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'You are a helpful FAQ assistant for a premium website. Keep your answers concise and friendly.' },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from OpenRouter');
        }

        const data = await response.json();
        removeTypingIndicator();

        const botResponse = data.choices[0].message.content;
        addMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Chatbot API Error:', error);
        removeTypingIndicator();
        addMessage("⚠️ **Error**: " + error.message + ". Please check your OpenRouter credits or API key status.", 'bot');
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
