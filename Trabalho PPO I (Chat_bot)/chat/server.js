import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
    try {
        const question = req.body.question;

        const response = await fetch("http://localhost:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemma3:4b",
                messages: [
                    {
                        role: "user",
                        content: question
                    }
                ],
                stream: false
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        res.json({
            answer: data.message.content
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log("Servidor funcionando em http://localhost:3000");
});