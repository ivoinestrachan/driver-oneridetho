import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const cancelledRides = await prisma.ride.findMany({
        where: {
          driverId: session.user.id, 
          status: 'Cancelled',
        },
        select: {
          id: true,
          status: true,
          pickupLocation: true,
          dropoffLocation: true,
        }
      });


      res.status(200).json(cancelledRides);
    } catch (error) {
      console.error("Error fetching cancelled rides for driver:", error);
      res.status(500).json({ message: 'Error fetching cancelled rides for driver' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
