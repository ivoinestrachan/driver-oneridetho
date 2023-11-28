import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const unacceptedRides = await prisma.ride.findMany({
        where: { isAccepted: false },
        include: { 
          user: {
            select: {
              id: true,
              name: true,
              rating: true,
              phone: true
            }
          }
        }
      });

      res.status(200).json(unacceptedRides);
    } catch (error) {
      console.error('Error fetching unaccepted rides:', error);
      res.status(500).json({ message: 'Error fetching unaccepted rides' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
