const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("question");
const messages = document.getElementById("messages");

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();

    if (!question) {
        return;
    }

    addMessage(question, "user");

    questionInput.value = "";

    const aiMessage = addMessage("Pensando...", "ai");

    try {
        const response = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        aiMessage.textContent = data.answer;

    } catch (error) {
        console.error(error);

        aiMessage.textContent = "Erro: " + error.message;
    }
});

function addMessage(text, type) {
    const message = document.createElement("div");

    message.classList.add("message", type);

    message.textContent = text;

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

    return message;
}