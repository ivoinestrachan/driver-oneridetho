import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  // photoUrl: string;
  rating: number;
  phone: number;
}

interface Ride {
  id: number;
  pickupLocation: any;
  dropoffLocation: any;
  user: User;
}

const Dashboard = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {data: session} = useSession()

  const acceptRide = async (rideId: number) => {
    setIsLoading(true);
    try {
      const driverId = session?.user.id;


      const response = await fetch(`/api/rides/accept/${rideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driverId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const updatedRides = rides.filter(ride => ride.id !== rideId);
      setRides(updatedRides);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const fetchUnacceptedRides = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/rides/unaccepted");
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data: Ride[] = await response.json();
        setRides(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnacceptedRides();
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="px-2">
      <div>
        {rides.map((ride) => (
          <div key={ride.id} className="mb-[20px] space-y-2">
            <div>
              <strong>Pickup Location:</strong>{" "}
              {JSON.stringify(ride.pickupLocation)}
            </div>
            <div>
              <strong>Dropoff Location:</strong>{" "}
              {JSON.stringify(ride.dropoffLocation)}
            </div>
            {ride.user && (
              <div>
                <strong>Passenger Name:</strong> {ride.user.name}
                <br />
                <strong>Rating:</strong> {ride.user.rating}
                <br />
              </div>
            )}
            <div className="space-y-2">
              <div>
                <button className="py-3 pl-8 pr-8 bg-green-500 rounded-md text-white"
                 onClick={() => acceptRide(ride.id)}
                >
                  Accept
                </button>
              </div>

              <div>
                <button className="py-3 pl-8 pr-8 bg-red-500 rounded-md text-white">
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
