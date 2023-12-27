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
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    fetch("/api/allride")
      .then((response) => response.json())
      .then((data) => {
        setRides(data);
        setFilteredRides(data);
      })
      .catch((error) => console.error("Error fetching rides:", error));
  }, []);

  useEffect(() => {
    if (selectedStatus === "") {
      setFilteredRides(rides);
    } else {
      setFilteredRides(rides.filter((ride) => ride.status === selectedStatus));
    }
  }, [selectedStatus, rides]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  return (
    <div>
      <div className="flex items-center mt-2">
        <h1 className="font-bold text-[24px] px-2">All Rides</h1>
        <select onChange={handleStatusChange} className="ml-4">
          <option value="">All</option>
          <option value="Requested">Requested</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Scheduled">Scheduled</option>
        </select>
        <Link href="/daily">
        <div   className="font-bold text-[24px] rounded-full border-2 pl-2 pr-2 ml-4">
            Earnings
          </div>
        </Link>
      </div>
      <ul className="px-2 overflow-y-scroll h-[100vh]">
        {filteredRides.map((ride) => (
          <Link href={`/ride/${ride.id}`} key={ride.id}>
              <li className="border-2 py-2 pl-2 pr-2 mt-2 rounded-md">
                <strong>Ride ID:</strong> {ride.id}
                <div>
                  <strong> Status:</strong> {ride.status}
                </div>
                <div>
                  <strong> Pickup Location:</strong> {JSON.stringify(ride.pickupLocation)}
                </div>
                <div>
                  <strong> Dropoff Location:</strong> {JSON.stringify(ride.dropoffLocation)}
                </div>
              </li>
         
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default Details;
