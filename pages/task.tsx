import Link from 'next/link';
import React, { useEffect, useState } from 'react';

type Ride = {
  id: number;
  status: string;
  pickupLocation: any;
  dropoffLocation: any;
};

interface DailyEarning {
  date: string;
  total: number;
}

const Task = () => {
  const [requestedRides, setRequestedRides] = useState<Ride[]>([]);
  const [scheduledRides, setScheduledRides] = useState<Ride[]>([]);
  const [showRequestedRides, setShowRequestedRides] = useState(true);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number | undefined>(undefined);

  useEffect(() => {
      fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
      try {
          const response = await fetch('/api/earnings');
          const data = await response.json();

          if (data.daily) {
              setDailyEarnings(data.daily);
          }
          if (data.total !== undefined) {
              setTotalEarnings(data.total);
          } else {
              console.error('Total earnings data is missing');
          }
      } catch (error) {
          console.error('Failed to fetch earnings data:', error);
      }
  };

  const paymentToOneRideTho = totalEarnings ? totalEarnings * 0.3 : 0;

  useEffect(() => {
    fetch('/api/allride') 
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const requested = data.filter((ride) => ride.status === 'Requested');
          const scheduled = data.filter((ride) => ride.status === 'Scheduled');
          setRequestedRides(requested);
          setScheduledRides(scheduled);
        } else {
          console.error('Unexpected data format:', data);
        }
      })
      .catch((error) => console.error('Error fetching rides:', error));
  }, []);

  return (
    <div>
      <div className='bg-green-400 mt-5 ml-2 px-2 w-[300px] pb-5 pt-3 rounded-md'>
       <div className='text-[16px]'>Weekly Earning</div>
       <div className='ml-2 text-[20px]'>
       ${totalEarnings !== undefined ? totalEarnings.toFixed(2) : 'Loading...'}
       </div>
       </div>
      <div className="flex items-center mt-2">
        <button
          onClick={() => setShowRequestedRides(true)}
          className={`font-bold text-[18px]  px-2 ${
            showRequestedRides ? 'text-blue-500' : ''
          }`}
        >
          Requested Rides
        </button>
        <button
          onClick={() => setShowRequestedRides(false)}
          className={`font-bold text-[18px] px-2 ${
            !showRequestedRides ? 'text-blue-500' : ''
          }`}
        >
          Scheduled Rides
        </button>
      </div>
      <ul className="px-2 overflow-y-scroll h-[90vh]">
        {showRequestedRides
          ? requestedRides.map((ride) => (
              <Link href={`/dashboard?rideId=${ride.id}`} key={ride.id}>
                <li className="border-2 py-2 pl-2 pr-2 mt-2 rounded-md">
                  <strong>Ride ID:</strong> {ride.id}
                  <div>
                    <strong>Status:</strong> {ride.status}
                  </div>
                  <div>
                    <strong>Pickup Location:</strong>{' '}
                    {JSON.stringify(ride.pickupLocation)}
                  </div>
                  <div>
                    <strong>Dropoff Location:</strong>{' '}
                    {JSON.stringify(ride.dropoffLocation)}
                  </div>
                </li>
              </Link>
            ))
          : scheduledRides.map((ride) => (
              <Link href={`/ride/${ride.id}`} key={ride.id}>
                <li className="border-2 py-2 pl-2 pr-2 mt-2 rounded-md">
                  <strong>Ride ID:</strong> {ride.id}
                  <div>
                    <strong>Status:</strong> {ride.status}
                  </div>
                  <div>
                    <strong>Pickup Location:</strong>{' '}
                    {JSON.stringify(ride.pickupLocation)}
                  </div>
                  <div>
                    <strong>Dropoff Location:</strong>{' '}
                    {JSON.stringify(ride.dropoffLocation)}
                  </div>
                </li>
              </Link>
            ))}
      </ul>
    </div>
  );
};

export default Task;
