import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma'; // Import the prisma object from the appropriate module
import { z } from "zod"; // Import the zod object from the appropriate module


// Create a new poll
export async function createPoll( app: FastifyInstance) {
    app.post('/polls', async (request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()),
        })

        const { title, options } = createPollBody.parse(request.body)

        const poll = await prisma.poll.create({
            data:{
                title,
                options: {
                    createMany: {
                        data: options.map(option => {
                            return { title: option }
                        }),
                    }
                },
            }
        })        
        return reply.status(201).send({"pollId": poll.id})
    })
}


