// src/lib/useSubscription.ts
'use client';

import { useState, useEffect } from 'react';

type SubscriptionStatus = 'free' | 'basic' | 'pro' | null;

const subscribers: Set<(status: SubscriptionStatus) => void> = new Set();

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(null);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/user/subscription', {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      const status = data.subscriptionStatus || 'free';
      setSubscription(status);
      // Notify all subscribers
      subscribers.forEach((callback) => callback(status));
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription('free');
    }
  };

  useEffect(() => {
    fetchSubscription();
    // Subscribe to updates
    const callback = (status: SubscriptionStatus) => setSubscription(status);
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  const updateSubscription = (newStatus: SubscriptionStatus) => {
    setSubscription(newStatus);
    subscribers.forEach((callback) => callback(newStatus));
  };

  return { subscription, fetchSubscription, updateSubscription };
}