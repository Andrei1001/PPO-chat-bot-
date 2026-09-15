import { Ollama } from "@langchain/ollama";
import {
    HumanMessage,
    AIMessage,
} from "@langchain/core/messages";
import { ChatMessageHistory } from "@langchain/core/chat_history";

const mainChatMessageHistory = new ChatMessageHistory();

export async function POST(req) {
    try {
        const { question } = await req.json();

        const model = new Ollama({
            model: "gemma3:4b",
            baseUrl: "http://localhost:11434",
        });

        await mainChatMessageHistory.addMessage(
            new HumanMessage(question)
        );

        const stream = new ReadableStream({
            async start(controller) {
                let fullResponse = "";
                let buffer = "";
                let lastWord = "";

                try {
                    for await (const chunk of await model.stream(question)) {
                        fullResponse += chunk;
                        buffer += chunk;

                        const words = buffer.split(/\s+/);

                        if (words.length >= 15) {
                            const completeWords = words
                                .slice(0, -1)
                                .join(" ");

                            controller.enqueue(
                                new TextEncoder().encode(
                                    JSON.stringify({
                                        text: completeWords,
                                        lastWord: lastWord,
                                    })
                                )
                            );

                            buffer = words[words.length - 1];

                            lastWord = completeWords
                                .split(/\s+/)
                                .pop();
                        }
                    }

                    if (buffer) {
                        controller.enqueue(
                            new TextEncoder().encode(
                                JSON.stringify({
                                    text: buffer,
                                    lastWord: lastWord,
                                    isLast: true,
                                })
                            )
                        );
                    }

                    await mainChatMessageHistory.addMessage(
                        new AIMessage(fullResponse)
                    );

                    controller.close();

                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/json",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}