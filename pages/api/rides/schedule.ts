import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const rideId = req.query.rideId as string;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { scheduledPickupTime } = req.body;

  if (!scheduledPickupTime) {
    return res.status(400).json({ message: 'Scheduled pickup time is required' });
  }

  try {
    const updatedRide = await prisma.ride.update({
      where: {
        id: parseInt(rideId, 10),
      },
      data: {
        isScheduled: true,
        scheduledPickupTime: new Date(scheduledPickupTime),
      },
    });

    return res.status(200).json(updatedRide);
  } catch (error) {
    console.error('Error scheduling the ride:', error);
    return res.status(500).json({ message: 'Error scheduling the ride' });
  }
}
