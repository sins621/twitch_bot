import ollama from 'ollama'

const response = await ollama.chat({
  model: 'tinyllama',
  messages: [{ role: 'user', content: `Rephrase: "Now playing 'The Days' by Notion" as a sarcastic AI. Only include rephrased text` }],
})

console.log(response.message.content)