import React, { useState, useEffect } from 'react';

interface DailyEarning {
    date: string;
    total: number;
}

const DailyReport = () => {
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

    return (
        <div>
            <h2>Daily Earnings Report</h2>
            {dailyEarnings.length > 0 ? (
                dailyEarnings.map((earning, index) => (
                    <div key={index}>
                        <p>Date: {new Date(earning.date).toLocaleDateString()}</p>
                        <p>Earnings: ${earning.total.toFixed(2)}</p>
                    </div>
                ))
            ) : (
                <p>Loading earnings data...</p>
            )}
            <h3>Total Earnings up to Sunday: ${totalEarnings !== undefined ? totalEarnings.toFixed(2) : 'Loading...'}</h3>
            <div>
                <h3>Total Payment to OneRideTho: ${paymentToOneRideTho.toFixed(2)}</h3>
            </div>
        </div>
    );
}

export default DailyReport;
