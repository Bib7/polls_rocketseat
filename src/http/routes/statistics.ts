import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma'; // Import the prisma object from the appropriate module



export async function generalStatistics(app: FastifyInstance) {
    app.get('/allPolls', async () => {

        const allPolls = await prisma.poll.aggregate({
            _count: { 
                id: true,
            },
        })
        return {"Total_Polls": allPolls} 
    })
}