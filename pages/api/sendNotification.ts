import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { rideId } = req.body;

    try {
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          user: true 
        }
      });

      if (ride && ride.user && ride.user.phone) {
        await twilioClient.messages.create({
          body: `Alert: Your ride has exceeded the 10-minute mark. You will be charged $1 for every additional minute.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: ride.user.phone
        });
        res.status(200).json({ message: 'Notification sent to user successfully' });
      } else {
        res.status(404).json({ message: 'Ride or user not found' });
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
      res.status(500).json({ message: 'Error sending notification to user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
