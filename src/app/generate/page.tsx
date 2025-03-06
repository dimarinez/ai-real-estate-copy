// src/app/GenerateListing.tsx
'use client';

import { useState, useEffect } from 'react';

export default function GenerateListing() {
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('default');
  const [language, setLanguage] = useState('English');
  const [maxWords, setMaxWords] = useState(''); // New field for max words
  const [generatedText, setGeneratedText] = useState('');
  const [socialContent, setSocialContent] = useState({ twitter: '', instagram: '', facebook: '', linkedin: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState('free'); // Default to free tier

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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Generate Real Estate Copy</h1>

      <input
        type="text"
        placeholder="Property Type (e.g., House, Apartment)"
        className="border p-2 mb-4 w-96 rounded"
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location (e.g., New York, LA)"
        className="border p-2 mb-4 w-96 rounded"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        type="text"
        placeholder="Features (e.g., Pool, Garage)"
        className="border p-2 mb-4 w-96 rounded"
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
      />
      <input
        type="number"
        placeholder={`Custom Word Limit (${subscription === 'pro' ? 'Default 200' : 'Default 100'})`}
        className="border p-2 mb-4 w-96 rounded"
        value={maxWords}
        onChange={(e) => setMaxWords(e.target.value)}
        min="1"
      />
      <select
        onChange={(e) => setTone(e.target.value)}
        className="border p-2 mb-4 w-96 rounded"
        disabled={subscription === 'free'}
        value={tone}
      >
        <option value="default">Default Tone</option>
        <option value="formal">Formal</option>
        <option value="casual">Casual</option>
      </select>
      <select
        onChange={(e) => setLanguage(e.target.value)}
        className="border p-2 mb-6 w-96 rounded"
        disabled={subscription === 'free'}
        value={language}
      >
        <option value="English">English</option>
        <option value="Spanish">Spanish</option>
        <option value="French">French</option>
        <option value="German">German</option>
      </select>

      <button
        onClick={handleGenerate}
        disabled={loading || !propertyType || !location || !features}
        className="bg-blue-500 text-white px-6 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Generate Copy'}
      </button>

      {message && <p className="mt-4 text-red-500">{message}</p>}

      {generatedText && (
        <div className="mt-6 p-4 border rounded bg-gray-100 max-w-lg w-full">
          <h2 className="text-lg font-bold">Generated Listing:</h2>
          <p className="mt-2">{generatedText}</p>
          <button onClick={handleSaveListing} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            Save Listing
          </button>
        </div>
      )}

      {subscription === 'pro' && (socialContent.twitter || socialContent.linkedin) && (
        <div className="mt-6 p-4 border rounded bg-gray-100 max-w-lg w-full">
          <h2 className="text-lg font-bold">Social Media Content:</h2>
          {socialContent.twitter && (
            <p className="mt-2"><strong>Twitter:</strong> {socialContent.twitter}</p>
          )}
          {socialContent.instagram && (
            <p className="mt-2"><strong>Instagram:</strong> {socialContent.instagram}</p>
          )}
          {socialContent.facebook && (
            <p className="mt-2"><strong>Facebook:</strong> {socialContent.facebook}</p>
          )}
          {socialContent.linkedin && (
            <p className="mt-2"><strong>LinkedIn:</strong> {socialContent.linkedin}</p>
          )}
        </div>
      )}
    </div>
  );
}