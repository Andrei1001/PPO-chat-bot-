const chat = document.getElementById("chat");
const mensagens = document.getElementById("Perguntar");
const enviar = document.getElementById("enviar");

enviar.addEventListener("click", async function () {
    const texto = mensagens.value.trim();

    if (texto === "") return;

    const novamensagem = document.createElement("div");
    novamensagem.textContent = texto;
    chat.appendChild(novamensagem);

    const status = document.createElement("div");
    status.textContent = "Enviando mensagem...";
    chat.appendChild(status);

    mensagens.value = "";

    try {
        const resposta = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pergunta: texto
            })
        });

        const respostaTexto = await resposta.text();

        const mensagemServidor = document.createElement("div");
        mensagemServidor.textContent = respostaTexto;
        chat.appendChild(mensagemServidor);

        status.textContent = "Resposta recebida!";

    } catch (erro) {
        status.textContent = "Erro ao enviar a mensagem. Tente novamente.";
        console.error("Erro:", erro);
    }
});