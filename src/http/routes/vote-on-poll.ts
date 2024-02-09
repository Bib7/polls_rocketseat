import { z } from "zod"; 
import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma'; 
import { FastifyInstance } from 'fastify';
import { redis } from '../../lib/redis';
import { voting } from '../../utils/voting-pub-sub';

// Vote on a poll
export async function votePoll( app: FastifyInstance) {
    app.post('/polls/:pollId/votes', async (request, reply) => {
        const votePollBody = z.object({
            pollOptionId: z.string().uuid(),
        })
        
        const voteOnPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = voteOnPollParams.parse(request.params)
        const { pollOptionId } = votePollBody.parse(request.body)
        
        let { sessionId } = request.cookies
        
        // Check if user already voted on this poll
        // also check if user has a session id
        if (sessionId){
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where:  {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    },
                }
            })
        
            // If user already voted on this poll and the vote is different, delete the previous vote and create a new one
            if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId){
                await prisma.vote.delete({
                    where:{
                        id: userPreviousVoteOnPoll.id
                    },
                    
                })
                
                reply.status(201).send({ message: 'Deleted previous vote'})
                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)
                
                voting.publish(pollId,{
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes)
                })
        

            }else if (userPreviousVoteOnPoll){
                return reply.status(400).send({ message: 'User already voted on this poll' })
            }

        // if user has no session id, create a new one
        }else if (!sessionId) {
            sessionId = randomUUID()
            
            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                signed: true,
                httpOnly: true,
            })
        }    

        // Create a new vote
        await prisma.vote.create({
            data: {
                pollOptionId,
                sessionId,
                pollId
            }
        })


        // incremente vote as cache on redis
        const votes = await redis.zincrby(pollId, 1, pollOptionId)
        
        voting.publish(pollId,{
            pollOptionId,
            votes: Number(votes)
        })

        return reply.status(201).send()
    })
}


