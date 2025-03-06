// src/app/GenerateListing.tsx
'use client';

import { useState, useEffect } from 'react';

export default function GenerateListing() {
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('default');
  const [language, setLanguage] = useState('English');
  const [maxWords, setMaxWords] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [socialContent, setSocialContent] = useState({ twitter: '', instagram: '', facebook: '', linkedin: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState('free');

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/user/subscription');
        const data = await res.json();
        setSubscription(data.subscriptionStatus || 'free');
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
    fetchSubscription();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage('');
    setGeneratedText('');
    setSocialContent({ twitter: '', instagram: '', facebook: '', linkedin: '' });

    const maxWordsValue = maxWords ? parseInt(maxWords, 10) : undefined;
    if (maxWordsValue && (isNaN(maxWordsValue) || maxWordsValue <= 0)) {
      setMessage('Max words must be a positive number');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyType,
        location,
        features: features.split(',').map((f) => f.trim()),
        tone,
        language,
        maxWords: maxWordsValue,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.text) {
      setGeneratedText(data.text);
      setSocialContent(data.social || {});
    } else {
      setMessage(data.error || 'Failed to generate listing');
    }
  };

  const handleSaveListing = async () => {
    const res = await fetch('/api/listings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Listing in ${location}`, description: generatedText }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg relative">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Generate Your Listing</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Property Type (e.g., House, Apartment)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Location (e.g., New York, LA)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Features (e.g., Pool, Garage)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            disabled={loading}
          />
          <input
            type="number"
            placeholder={`Custom Word Limit (${subscription === 'pro' ? 'default 200' : 'default 100'})`}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            value={maxWords}
            onChange={(e) => setMaxWords(e.target.value)}
            min="1"
            max="500"
            disabled={loading}
          />
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={subscription === 'free' || loading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
          >
            <option value="default">Default Tone</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={subscription === 'free' || loading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading || !propertyType || !location || !features}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Generating...' : 'Generate Copy'}
          </button>
        </div>

        {/* Improved Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="text-white text-lg font-semibold animate-pulse">Generating Your Listing...</p>
            </div>
          </div>
        )}

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}

        {generatedText && (
          <div className="mt-6 p-6 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Generated Listing</h2>
            <p className="text-gray-700">{generatedText}</p>
            <button
              onClick={handleSaveListing}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save Listing
            </button>
          </div>
        )}

        {subscription !== 'free' && (socialContent.twitter || socialContent.linkedin) && (
          <div className="mt-6 p-6 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Social Media Content</h2>
            {socialContent.twitter && (
              <p className="mt-2">
                <strong>Twitter:</strong> {socialContent.twitter}{' '}
                <span className="text-gray-500 text-sm">({socialContent.twitter.length} chars)</span>
              </p>
            )}
            {socialContent.instagram && (
              <p className="mt-2">
                <strong>Instagram:</strong> {socialContent.instagram}{' '}
                <span className="text-gray-500 text-sm">({socialContent.instagram.length} chars)</span>
              </p>
            )}
            {socialContent.facebook && (
              <p className="mt-2">
                <strong>Facebook:</strong> {socialContent.facebook}{' '}
                <span className="text-gray-500 text-sm">({socialContent.facebook.length} chars)</span>
              </p>
            )}
            {socialContent.linkedin && (
              <p className="mt-2">
                <strong>LinkedIn:</strong> {socialContent.linkedin}{' '}
                <span className="text-gray-500 text-sm">({socialContent.linkedin.length} chars)</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}