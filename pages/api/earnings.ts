import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function earningsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {

    try {
      const session = await getSession({ req }); 
      if (!session || !session.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const driverId = session.user.id;

      const rides = await prisma.ride.findMany({
        where: {
          driverId: driverId,
          status: 'Completed'
        }
      });

      const earnings = rides.map(ride => ({
        date: ride.pickupTime,
        amount: ride.fare * (1 - 0.3) 
      }));

      const dailyEarnings = calculateDailyEarnings(earnings);
      const totalEarnings = earnings.reduce((acc, curr) => acc + curr.amount, 0);

      res.status(200).json({ daily: dailyEarnings, total: totalEarnings });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({ message: 'Error fetching earnings' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

interface Earning {
  date: Date;
  amount: number;
}

function calculateDailyEarnings(earnings: Earning[]): { date: string, total: number }[] {
  const dailyEarnings: { [key: string]: number } = {};

  earnings.forEach(earning => {
    const dateKey = earning.date.toISOString().split('T')[0]; 
    if (!dailyEarnings[dateKey]) {
      dailyEarnings[dateKey] = 0;
    }
    dailyEarnings[dateKey] += earning.amount;
  });

  return Object.keys(dailyEarnings).map(date => ({
    date,
    total: dailyEarnings[date]
  }));
}
