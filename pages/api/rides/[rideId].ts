import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';

const prisma = new PrismaClient();
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const { rideId } = req.query;

  try {
    const rideIdNumber = parseInt(rideId as string);

    if (req.method === 'GET') {
      const ride = await prisma.ride.findUnique({
        where: { id: rideIdNumber },
        include: { user: true },
      });

      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }

      res.status(200).json(ride);

    } else if (req.method === 'PATCH') {
      const { status, dropoffTime } = req.body;

      const updatedRide = await prisma.ride.update({
        where: { id: rideIdNumber },
        data: {
          status, 
          dropoffTime: dropoffTime ? new Date(dropoffTime) : null,
        },
        include: { user: true },
      });

      if (status === 'InProgress' && updatedRide.user && updatedRide.user.phone) {
        await twilioClient.messages.create({
          body: 'Your driver is outside. Please proceed to your pickup location.',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: updatedRide.user.phone,
        });
      } else if (status === 'Completed' && updatedRide.user && updatedRide.user.phone) {
        const ratingLink = `https://driver-oneridetho.vercel.app/ride/${rideIdNumber}`;
        await twilioClient.messages.create({
          body: `Thank you or riding with us. Please rate your driver here: ${ratingLink}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: updatedRide.user.phone,
        });
      }

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
