import { PrismaClient } from '@prisma/client';
import { getSession } from "next-auth/react";
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const rideIdStr = typeof req.query.rideId === 'string' ? req.query.rideId : null;
    if (!rideIdStr) {
      return res.status(400).json({ message: 'Invalid ride ID' });
    }
    const rideId = parseInt(rideIdStr);


    const driverId = typeof req.body.driverId === 'number' ? req.body.driverId : null;
    if (driverId === null) {
      return res.status(400).json({ message: 'Invalid driver ID' });
    }

    try {
      const updatedRide = await prisma.ride.update({
        where: { id: rideId },
        data: {
          isAccepted: true,
          driverId: driverId
        }
      });

      res.status(200).json({ message: 'Ride accepted successfully', updatedRide });
    } catch (error) {
      console.error('Error accepting the ride:', error);
      res.status(500).json({ message: 'Error accepting the ride' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
