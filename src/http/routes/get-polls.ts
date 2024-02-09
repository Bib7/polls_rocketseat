import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma'; // Import the prisma object from the appropriate module
import { z } from "zod"; // Import the zod object from the appropriate module
import { redis } from '../../lib/redis'; // Import the redis object from the appropriate module


// Get a poll crated by the user
export async function getPoll( app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, reply) => {
        
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = getPollParams.parse(request.params)

        

        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            include:{
                options:{
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })  
        
        
        if (!poll){
            return reply.status(404).send({ message: 'Poll not found'})
        }    
        
        const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')
        
        const votes = result.reduce((obj, line, index) => {
            if (index % 2 === 0){
                const score = result[index + 1]

                Object.assign(obj, { [line]: Number(score) })
            }
            return obj
        }, {} as Record<string, number>)
        
        console.log(votes)
        return reply.status(201).send({ 
            poll : {
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option => ({
                    id: option.id,
                    title: option.title,
                    score: (option.id in votes) ? votes[option.id] : 0}))
            }
         }) 
    })
}


