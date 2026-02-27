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
                // Using a standard URL as Referer often fixes authentication issues for local file execution
                'HTTP-Referer': 'https://github.com/karthikxa/FAQ-Chatbot',
                'X-Title': 'Premium FAQ Chatbot',
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
            const errorMessage = errorData.error?.message || 'Failed to fetch from OpenRouter';

            // Specifically handling "User not found" which is common for invalid/unauthenticated keys
            if (errorMessage.includes("User not found")) {
                throw new Error("API Key Authentication Failed (User not found). Please verify your key on OpenRouter.ai");
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        removeTypingIndicator();

        if (data.choices && data.choices[0]) {
            const botResponse = data.choices[0].message.content;
            addMessage(botResponse, 'bot');
        } else {
            throw new Error("Invalid response format from API");
        }

    } catch (error) {
        console.error('Chatbot API Error:', error);
        removeTypingIndicator();
        addMessage("⚠️ **Error**: " + error.message + ". \n\n**Troubleshooting:**\n1. Check if your API key has credits.\n2. Ensure the key is copied correctly.\n3. Try a free model like `google/gemini-2.0-flash-lite-preview-02-05:free`.", 'bot');
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
