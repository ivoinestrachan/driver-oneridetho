import Link from "next/link";
import React, { useEffect, useState } from "react";

type Ride = {
  id: number;
  status: string;
  pickupLocation: any;
  dropoffLocation: any;
};

const Details = () => {
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    fetch("/api/allride")
      .then((response) => response.json())
      .then((data) => setRides(data))
      .catch((error) => console.error("Error fetching rides:", error));
  }, []);

  return (
    <div>
        <div className="flex items-center mt-2">
      <h1 className="font-bold text-[24px] px-2">All Rides</h1>
      <Link href="/daily" className="font-bold text-[24px] rounded-full border-2 pl-2 pr-2">
      <div>Earnings</div>
      </Link>
      </div>
      <ul className="px-2  overflow-y-scroll h-[100vh]">
        {rides.map((ride) => (
            <Link href={`/ride/${ride.id}`}>
          <li key={ride.id} className="border-2 py-2 pl-2 pr-2 mt-2 rouned-md">
            <strong>Ride ID:</strong> {ride.id},
            <div>
              <strong> Status:</strong> {ride.status},
            </div>
            <div>
              <strong> Pickup Location:</strong>{" "}
              {JSON.stringify(ride.pickupLocation)},
            </div>
            <div>
              <strong> Dropoff Location:</strong>{" "}
              {JSON.stringify(ride.dropoffLocation)}
            </div>
          </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default Details;
