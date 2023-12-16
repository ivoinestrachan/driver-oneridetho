import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { rideId } = req.query;

  if (req.method === 'GET') {
    try {
      const ride = await prisma.ride.findUnique({
        where: {
          id: parseInt(rideId as string),
        },
        include: {
          user: true,
        },
      });

      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      res.status(200).json(ride);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving ride details' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
