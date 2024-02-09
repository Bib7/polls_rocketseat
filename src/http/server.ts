import fastify from 'fastify'
import cookie from '@fastify/cookie'
import websocket from '@fastify/websocket'
import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-polls'
import { votePoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results'

const app = fastify()

app.register(cookie, {	
    secret: "node-npm-nlw-rocketseat", 
    hook: 'onRequest'
})
    
app.register(websocket)


app.register(createPoll)
app.register(getPoll)
app.register(votePoll)
app.register(pollResults)


app.listen({ port: 3000}).then(() => {
    console.log('Server up and running')
})
