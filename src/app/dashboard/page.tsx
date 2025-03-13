// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaCopy, FaTrash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface Social {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

interface Analytics {
  views: number;
  trackableUrl: string;
  redirectUrl: string;
  lastUpdated?: string;
}

interface Listing {
  title: string; // Now represents location
  description: string;
  location?: string; // Kept for backward compatibility or additional details
  date: string;
  social?: Social;
  analytics?: Analytics;
}

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [visibleListings, setVisibleListings] = useState(6);
  const [loading, setLoading] = useState(true); // Controls initial load
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<string | null>(null); // Null until loaded
  const [expandedListing, setExpandedListing] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'analytics' | 'social'>('description');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsRes, subRes] = await Promise.all([
        fetch('/api/listings/get'),
        fetch('/api/user/subscription'),
      ]);

      const listingsData = await listingsRes.json();
      const subData = await subRes.json();

      if (listingsData.error) setError(listingsData.error);
      else setListings(listingsData.savedListings || []);

      setSubscription(subData.subscriptionStatus || 'free');
    } catch (err) {
      setError('Failed to load data. Please try again: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedListing(expandedListing === index ? null : index);
    setActiveTab('description');
  };

  const loadMore = () => {
    setVisibleListings((prev) => prev + 6);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteListing = async (index: number) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        const res = await fetch('/api/listings/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index }),
        });
        if (res.ok) {
          setListings((prev) => prev.filter((_, i) => i !== index));
          if (expandedListing === index) setExpandedListing(null);
        } else {
          setError('Failed to delete listing');
        }
      } catch (err) {
        setError('Error deleting listing: ' + err);
      }
    }
  };

  // Wait until subscription is loaded to compute maxSaved
  const maxSaved = subscription === 'pro' ? 500 : subscription === 'basic' ? 25 : 5;

  // Show loading state until data is fully fetched
  if (loading || subscription === null) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Listings Dashboard</h1>
          <div className="inline-flex items-center gap-2 bg-gray-100 bg-gradient-to-r from-gray-100 to-gray-200 [-webkit-gradient(linear,_left_top,_right_top,_from(#f3f4f6),_to(#e5e7eb))] px-4 py-2 rounded-full shadow-sm">
            <span className="text-lg text-gray-700">Subscription:</span>
            <span
              className={`font-semibold text-lg ${
                subscription === 'pro' ? 'text-green-600' : subscription === 'basic' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {subscription.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">({listings.length}/{maxSaved} saved)</span>
          </div>
          {listings.length >= maxSaved && (
            <p className="mt-3 text-sm text-orange-600">
              Upgrade your plan to save more listings!{' '}
              <a href="/pricing" className="text-blue-600 hover:underline">
                See Plans
              </a>
            </p>
          )}
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
            <FaExclamationCircle />
            <p>{error}</p>
          </div>
        )}

        {/* No Listings */}
        {!listings.length && !error && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
            <p className="text-lg text-gray-600">No saved listings yet.</p>
            <a
              href="/generate"
              className="mt-4 inline-block bg-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 [-webkit-gradient(linear,_left_top,_right_top,_from(#2563eb),_to(#1d4ed8))] text-white py-2 px-6 rounded-lg hover:bg-blue-700 hover:[-webkit-gradient(linear,_left_top,_right_top,_from(#1d4ed8),_to(#1e3a8aDV))] transition shadow-md"
            >
              Generate Your First Listing
            </a>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {listings.slice(0, visibleListings).map((listing, index) => (
              <div
                key={index}
                onClick={() => toggleExpand(index)}
                className={`bg-white p-6 rounded-xl shadow-md border ${
                  subscription === 'pro' ? 'border-green-200' : 'border-gray-200'
                } transition-all duration-300 hover:shadow-lg cursor-pointer animate-fade-in`}
              >
                <div className="mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">{listing.title}</h2>
                  <p className="text-xs text-gray-400 mt-2">
                    Saved: {new Date(listing.date).toLocaleDateString()}
                  </p>
                </div>

                {expandedListing === index && (
                  <div className="mt-4 space-y-4">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('description');
                        }}
                        className={`py-2 px-4 text-sm font-medium ${
                          activeTab === 'description'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        Description
                      </button>
                      {subscription === 'pro' && listing.analytics && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('analytics');
                          }}
                          className={`py-2 px-4 text-sm font-medium ${
                            activeTab === 'analytics'
                              ? 'border-b-2 border-blue-600 text-blue-600'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          Analytics
                        </button>
                      )}
                      {listing.social && subscription !== 'free' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('social');
                          }}
                          className={`py-2 px-4 text-sm font-medium ${
                            activeTab === 'social'
                              ? 'border-b-2 border-blue-600 text-blue-600'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          Social
                        </button>
                      )}
                    </div>

                    {/* Tab Content */}
                    <div className="text-gray-700">
                      {activeTab === 'description' && (
                        <div className="space-y-3">
                          {listing.location && listing.location !== listing.title && (
                            <p className="text-sm text-gray-600">Location: {listing.location}</p>
                          )}
                          <p className="text-gray-600 leading-relaxed max-h-48 overflow-y-auto">
                            {listing.description}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(listing.description, `${index}-desc`);
                              }}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <FaCopy />
                              {copied === `${index}-desc` ? (
                                <span className="flex items-center gap-1">
                                  <FaCheckCircle className="text-green-500" /> Copied!
                                </span>
                              ) : (
                                'Copy'
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteListing(index);
                              }}
                              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === 'analytics' && subscription === 'pro' && listing.analytics && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">
                            Link Views: {listing.analytics.views}{' '}
                            <span className="text-xs text-gray-500">
                              (Redirects to:{' '}
                              <a
                                href={listing.analytics.redirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {listing.analytics.redirectUrl}
                              </a>
                              )
                            </span>
                          </p>
                          {listing.analytics.lastUpdated && (
                            <p className="text-xs text-gray-500">
                              Last Updated: {new Date(listing.analytics.lastUpdated).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}

                      {activeTab === 'social' && listing.social && subscription !== 'free' && (
                        <div className="space-y-4 text-sm">
                          {Object.entries(listing.social).map(([platform, content]) =>
                            content ? (
                              <div key={platform} className="space-y-1">
                                <p className="font-medium capitalize text-gray-700">{platform}:</p>
                                <p className="text-gray-600 leading-relaxed">{content}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(content, `${index}-${platform}`);
                                  }}
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <FaCopy />
                                  {copied === `${index}-${platform}` ? (
                                    <span className="flex items-center gap-1">
                                      <FaCheckCircle className="text-green-500" /> Copied!
                                    </span>
                                  ) : (
                                    'Copy'
                                  )}
                                </button>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {visibleListings < listings.length && (
          <div className="mt-10 text-center">
            <button
              onClick={loadMore}
              className="bg-blue-600 bg-gradient-to-r from-blue-600 to-blue-700 [-webkit-gradient(linear,_left_top,_right_top,_from(#2563eb),_to(#1d4ed8))] text-white py-2 px-6 rounded-lg hover:bg-blue-700 hover:[-webkit-gradient(linear,_left_top,_right_top,_from(#1d4ed8),_to(#1e3a8aDV))] transition shadow-md"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}