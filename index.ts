import login from "./index.html"
import home from "./home.html"
import db from "./db.ts"

const loggedUsers: any = {}

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/": login,

        "/home": home,

        "/user": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`INSERT INTO user(username, password_hash) VALUES(:username, :password_hash)`)
                const hash = await Bun.password.hash(body.password)
                const data = query.run({ ":username": body.username, ":password_hash": hash })
                return Response.json(data)
            },
        },

        "/login": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`SELECT * FROM user WHERE username=:username LIMIT 1`)
                const data: any = query.get({ ":username": body.username })
                if (!data)
                    return Response.json({ msg: "usuário não encontrado" }, { status: 404 })
                const isMatch = await Bun.password.verify(body.password, data.password_hash)
                if (!isMatch)
                    return Response.json({ msg: "senha não confere" }, { status: 401 })
                const uuid = crypto.randomUUID();
                delete data.password_hash
                loggedUsers[uuid] = data
                req.cookies.set("ses", uuid)
                return Response.json(isMatch)
            }
        },

        "/login/user": (req) => {
            const ses = req.cookies.get("ses")
            if (!ses || !loggedUsers[ses])
                return Response.json({ msg: "não permitido" }, { status: 401 })
            return Response.json(loggedUsers[ses])
        },

        "/chat": {
            POST: async (req) => {
                try {
                    const body = await req.json();

                    if (!body.pergunta || typeof body.pergunta !== "string") {
                        return Response.json(
                            { msg: "Pergunta inválida" },
                            { status: 400 }
                        );
                    }

                    const respostaIA = await fetch("http://localhost:11434/api/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "gemma3:4b",
                            messages: [
                                {
                                    role: "user",
                                    content: body.pergunta
                                }
                            ],
                            stream: false
                        })
                    });

                    if (!respostaIA.ok) {
                        return Response.json(
                            { msg: "Erro ao acessar o Ollama" },
                            { status: 502 }
                        );
                    }

                    const dados = await respostaIA.json();

                    return new Response(dados.message.content, {
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    });

                } catch (erro) {
                    console.error(erro);

                    return Response.json(
                        { msg: "Erro ao processar a pergunta" },
                        { status: 500 }
                    );
                }
            }
        }
    },
})
