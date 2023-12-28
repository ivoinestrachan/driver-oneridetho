import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

type RequestBody = {
    driverId: number;
    location: {
      lat: number;
      lng: number;
    };
  };

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse
  ) {
    if (req.method === 'PATCH') {
      try {
        const { driverId, location } = req.body as RequestBody;
  
        const updatedLocation = await prisma.location.upsert({
          where: {
            driverId: driverId
          },
          update: {
            lat: location.lat,
            long: location.lng
          },
          create: {
            driverId,
            lat: location.lat,
            long: location.lng
          }
        });
  
        res.status(200).json({ message: 'Location updated successfully', updatedLocation });
      } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.setHeader('Allow', ['PATCH']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  