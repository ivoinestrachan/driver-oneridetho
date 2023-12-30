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

  console.log("Session Driver ID:", session.user.id); // Assuming session.user.id is the driver's ID

  if (req.method === 'GET') {
    try {
      const completedRides = await prisma.ride.findMany({
        where: {
          driverId: session.user.id,
          status: 'Completed',
        },
        select: {
          id: true,
          status: true,
          pickupLocation: true,
          dropoffLocation: true,
          scheduledPickupTime: true,
        }
      });


      res.status(200).json(completedRides);
    } catch (error) {
      console.error("Error fetching completed rides for driver:", error);
      res.status(500).json({ message: 'Error fetching completed rides for driver' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
