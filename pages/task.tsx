import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaHistory } from "react-icons/fa";

type Ride = {
  id: number;
  status: string;
  pickupLocation: any;
  dropoffLocation: any;
  scheduledPickupTime?: string;
};

interface DailyEarning {
  date: string;
  total: number;
}

const Task = () => {
  const [requestedRides, setRequestedRides] = useState<Ride[]>([]);
  const [scheduledRides, setScheduledRides] = useState<Ride[]>([]);
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [cancelledRides, setCancelledRides] = useState<Ride[]>([]);

  const renderNoRidesMessage = () => {
    return <div className="text-center py-[200px] font-bold text-[24px]">No rides</div>;
  };

  const [showRequestedRides, setShowRequestedRides] = useState(true);
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [rideHistoryType, setRideHistoryType] = useState<
    "completed" | "cancelled" | "none"
  >("none");
  const [activeButton, setActiveButton] = useState<
    "requested" | "scheduled" | "history"
  >("requested");

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(
      new Date(dateString)
    );
  };

  useEffect(() => {
    fetch("/api/allride")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const requested = data.filter((ride) => ride.status === "Requested");
          const scheduled = data.filter((ride) => ride.status === "Scheduled");
          setRequestedRides(requested);
          setScheduledRides(scheduled);
        }
      })
      .catch((error) => console.error("Error fetching rides:", error));
  }, []);

  const handleRideHistoryType = async (type: "completed" | "cancelled") => {
    setShowRideHistory(false);
    setRideHistoryType(type);
    const response = await fetch(`/api/rides/${type}`);
    const rides = await response.json();
    type === "completed" ? setCompletedRides(rides) : setCancelledRides(rides);
  };

  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const response = await fetch("/api/earnings");
      const data = await response.json();

      if (data.daily) {
        setDailyEarnings(data.daily);
      }
      if (data.total !== undefined) {
        setTotalEarnings(data.total);
      } else {
        console.error("Total earnings data is missing");
      }
    } catch (error) {
      console.error("Failed to fetch earnings data:", error);
    }
  };

  const paymentToOneRideTho = totalEarnings ? totalEarnings * 0.3 : 0;

  const renderRides = (rides: Ride[]) => {
    return rides.length > 0 ? (
     rides.map((ride) => (
      <Link href={`/dashboard?rideId=${ride.id}`} key={ride.id}>
        <li className="border-2 py-2 pl-2 pr-2 mt-2 rounded-md">
          <strong>Ride ID:</strong> {ride.id}
          <div>
            <strong>Status:</strong> {ride.status}
          </div>
          <div>
            <strong>Pickup Location:</strong>{" "}
            {JSON.stringify(ride.pickupLocation)}
          </div>
          <div>
            <strong>Dropoff Location:</strong>{" "}
            {JSON.stringify(ride.dropoffLocation)}
          </div>
          {ride.scheduledPickupTime && (
            <div>
              <strong>Scheduled Pickup Time:</strong>{" "}
              {formatDate(ride.scheduledPickupTime)}
            </div>
          )}
        </li>
      </Link>
     ))
     ) : (
       renderNoRidesMessage()
     );
   
  };

  return (
    <div>
      <div className="bg-green-400 mt-5 ml-2 px-2 w-[300px] pb-5 pt-3 rounded-md">
        <div className="flex items-center justify-between w-[95%]">
          <div className="text-[16px]">Weekly Earning</div>
          <div className="text-[16px]">Payout To ORT</div>
        </div>
        <div className="flex items-center justify-between w-[75%]">
        <div className="ml-2 text-[20px]">
          $
          {totalEarnings !== undefined
            ? totalEarnings.toFixed(2)
            : "Loading..."}
        </div>

        <div className="text-[20px]">
        ${paymentToOneRideTho.toFixed(2)}
        </div>
        </div>
      </div>

      <div className="flex items-center mt-2">
        <button
          onClick={() => {
            setShowRequestedRides(true);
            setActiveButton("requested");
          }}
          className={`font-bold text-[18px] px-2 ${
            activeButton === "requested" ? "text-blue-500" : ""
          }`}
        >
          Requested Rides
        </button>
        <button
          onClick={() => {
            setShowRequestedRides(false);
            setActiveButton("scheduled");
          }}
          className={`font-bold text-[18px] px-2 ${
            activeButton === "scheduled" ? "text-blue-500" : ""
          }`}
        >
          Scheduled Rides
        </button>
        <button
          onClick={() => {
            setShowRideHistory(true);
            setActiveButton("history");
          }}
          className={`font-bold text-[24px] px-2 ${
            activeButton === "history" ? "text-blue-500" : ""
          }`}
        >
          <FaHistory />
        </button>
      </div>

      {showRideHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-md">
            <button
              onClick={() => handleRideHistoryType("completed")}
              className="text-blue-500 hover:underline"
            >
              Completed Rides
            </button>
            <br />
            <button
              onClick={() => handleRideHistoryType("cancelled")}
              className="text-blue-500 hover:underline"
            >
              Cancelled Rides
            </button>
            <br />
            <button
              onClick={() => setShowRideHistory(false)}
              className="text-red-500 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ul className="px-2 overflow-y-scroll h-[90vh]">
        {(activeButton === "requested" || activeButton === "scheduled") &&
          (showRequestedRides
            ? renderRides(requestedRides)
            : renderRides(scheduledRides))}
        {activeButton === "history" &&
          (rideHistoryType === "completed"
            ? renderRides(completedRides)
            : renderRides(cancelledRides))}
      </ul>
    </div>
  );
};

export default Task;
