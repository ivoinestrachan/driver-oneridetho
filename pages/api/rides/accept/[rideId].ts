import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function formatTime(date: any) {
  if (!date) return '';

  const d = new Date(date);

  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };

  //@ts-ignore
  return d.toLocaleString('en-US', options);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        },
        include: {
          driver: true,
          user: true
        }
      });

      if (updatedRide.driver && updatedRide.user && updatedRide.user.phone) {
        await twilioClient.messages.create({
          body: `Good news! Your ride has been confirmed.\n\nDriver: ${updatedRide.driver.name}\nCar: ${updatedRide.driver.carType} - ${updatedRide.driver.licensePlate}\nEstimated Pickup Time: ${formatTime(updatedRide.pickupTime)}\n\nFor more details: https://oneridetho.vercel.app//rides/${updatedRide.id}\n\nHave a safe and pleasant journey!`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: updatedRide.user.phone
        });
      }

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


