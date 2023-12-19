import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { rideId } = req.query;

  try {
    if (req.method === 'GET') {
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
    } else if (req.method === 'PATCH') {

      const { status, dropoffTime } = req.body; 

      const updatedRide = await prisma.ride.update({
        where: {
          id: parseInt(rideId as string),
        },
        data: {
          status, 
          dropoffTime: dropoffTime ? new Date(dropoffTime) : null, 
        },
      });

      res.status(200).json(updatedRide);
    } else {
      res.setHeader('Allow', ['GET', 'PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    res.status(500).json({ message: 'Internal server error', error: errorMessage });
  }
}
