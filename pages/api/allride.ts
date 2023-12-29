import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const rides = await prisma.ride.findMany({
        select: {
          id: true,
          status: true,
          pickupLocation: true,
          dropoffLocation: true,
          scheduledPickupTime: true,
        }
      });
      res.status(200).json(rides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      res.status(500).json({ message: 'Error fetching rides' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
