// src/app/components/GenerateListing.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaCopy, FaSave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { Autocomplete, useLoadScript, Libraries } from '@react-google-maps/api';

// Define libraries as a const array with inferred type or explicit Libraries type
const libraries: Libraries = ['places']; // Only 'places' is needed for Autocomplete

type SocialContent = {
  twitter: string;
  instagram: string;
  facebook: string;
  linkedin: string;
};

export default function GenerateListing() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [tone, setTone] = useState('default');
  const [language, setLanguage] = useState('English');
  const [maxWords, setMaxWords] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [socialContent, setSocialContent] = useState<SocialContent>({
    twitter: '',
    instagram: '',
    facebook: '',
    linkedin: '',
  });
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState('free');
  const [savedListingsCount, setSavedListingsCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries, // Pass the correctly typed libraries
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [subRes, listingsRes] = await Promise.all([
          fetch('/api/user/subscription'),
          fetch('/api/listings/get'),
        ]);
        const subData = await subRes.json();
        const listingsData = await listingsRes.json();
        setSubscription(subData.subscriptionStatus || 'free');
        setSavedListingsCount(listingsData.savedListings?.length || 0);
        setGenerationCount(subData.generationCount || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 10) {
        setMessage('Maximum 10 photos allowed.');
        setPhotos(files.slice(0, 10));
      } else {
        setPhotos(files);
        setMessage('');
      }
    }
  };

  const handleGenerate = async () => {
    if (photos.length === 0) {
      setMessage('Please upload at least one property photo.');
      return;
    }

    const maxGenerations = subscription === 'pro' ? 25 : subscription === 'basic' ? 5 : 0;
    if (generationCount >= maxGenerations) {
      setMessage(`You’ve reached your daily limit of ${maxGenerations} generations. Upgrade your plan or try again tomorrow.`);
      return;
    }

    setLoading(true);
    setMessage('');
    setGeneratedText('');
    setSocialContent({ twitter: '', instagram: '', facebook: '', linkedin: '' });
    setCopied(null);
    setRedirectUrl('');

    setLoadingMessage('Analyzing photos…');
    setTimeout(() => setLoadingMessage('Generating content…'), 2000);

    const maxWordsValue = maxWords ? parseInt(maxWords, 10) : undefined;
    if (maxWordsValue && (isNaN(maxWordsValue) || maxWordsValue <= 0)) {
      setMessage('Max words must be a positive number');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });
    formData.append('photoCount', photos.length.toString());
    formData.append('tone', tone);
    formData.append('language', language);
    formData.append('location', location);
    if (maxWordsValue) formData.append('maxWords', maxWordsValue.toString());

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (data.text) {
        setGeneratedText(data.text);
        if (subscription !== 'free') {
          setSocialContent(data.social || { twitter: '', instagram: '', facebook: '', linkedin: '' });
        }
        setGenerationCount((prev) => prev + 1);
        setMessage(
          subscription === 'free'
            ? 'Listing generated! Click "Save" to store it.'
            : subscription === 'pro'
            ? 'Listing and social media generated! Add a redirect URL below to track views.'
            : 'Listing and social media generated! Click "Save" to store them.'
        );
      } else {
        setMessage(data.error || 'Failed to generate content');
      }
    } catch (error) {
      setLoading(false);
      setMessage('Failed to process photos. Try again.');
      console.error('Fetch error:', error);
    }
  };

  const handleSave = async () => {
    const maxSaved = subscription === 'pro' ? 500 : subscription === 'basic' ? 10 : 5;
    if (savedListingsCount >= maxSaved) {
      setMessage(`You’ve reached your limit of ${maxSaved} saved listings. Upgrade or delete existing listings.`);
      return;
    }

    try {
      const res = await fetch('/api/listings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: location || `${generatedText.split(' ').slice(0, 5).join(' ')} Listing`,
          description: generatedText,
          location,
          social: subscription !== 'free' ? socialContent : undefined,
          redirectUrl: subscription === 'pro' ? redirectUrl : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSavedListingsCount((prev) => prev + 1);
        setMessage(
          subscription === 'free'
            ? 'Listing saved successfully! View it in your dashboard.'
            : subscription === 'pro'
            ? 'Listing and social media saved successfully! Share with the link to track views.'
            : 'Listing and social media saved successfully! View them in your dashboard.'
        );
      } else {
        setMessage(data.error || 'Failed to save listing');
      }
    } catch (error) {
      setMessage('Error saving listing. Try again.');
      console.error('Save error:', error);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getMessageStyles = () => {
    if (message.includes('successfully')) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (
      message.includes('upload') ||
      message.includes('number') ||
      message.includes('process') ||
      message.includes('save listing') ||
      message.includes('generate content')
    ) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-10 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Create Your Real Estate Listing</h1>

      {/* Form Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-xl z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-700 font-medium">{loadingMessage}</p>
            </div>
          </div>
        )}
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Photos (Max 10)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:text-gray-400 transition-all"
            />
            {photos.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">{photos.length}/10 photos selected</p>
            )}
          </div>

          <div className="relative">
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
            >
              <option value="default">Default</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div className="relative">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              placeholder="English"
            />
          </div>

          <div className="relative">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Autocomplete
              onLoad={(autocomplete) => {
                autocomplete.addListener('place_changed', () => {
                  const place = autocomplete.getPlace();
                  if (place.formatted_address) {
                    setLocation(place.formatted_address);
                  }
                });
              }}
              onPlaceChanged={() => {}}
            >
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                placeholder="e.g., 12345 Real Estate, San Diego, CA"
              />
            </Autocomplete>
          </div>

          <div className="relative">
            <label htmlFor="maxWords" className="block text-sm font-medium text-gray-700 mb-1">
              Max Words
            </label>
            <input
              id="maxWords"
              type="number"
              value={maxWords}
              onChange={(e) => setMaxWords(e.target.value)}
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              placeholder={subscription === 'free' ? '100 (Free)' : '200 (Paid)'}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md"
          >
            {loading ? 'Generating…' : 'Generate Listing'}
          </button>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg border flex items-center gap-2 animate-fade-in ${getMessageStyles()}`}>
          {message.includes('successfully') ? (
            <FaCheckCircle className="text-green-600" />
          ) : message.includes('upload') ||
            message.includes('number') ||
            message.includes('process') ||
            message.includes('save listing') ||
            message.includes('generate content') ? (
            <FaExclamationCircle className="text-red-600" />
          ) : (
            <FaCheckCircle className="text-blue-600" />
          )}
          <p className="flex-1">{message}</p>
          {message.includes('limit') && (
            <a href="/pricing" className="text-blue-600 hover:underline">
              Upgrade Now
            </a>
          )}
          {message.includes('saved') && (
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
          )}
        </div>
      )}

      {/* Generated Content */}
      {generatedText && (
        <div className="mt-8 bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Generated Listing</h2>
              <button
                onClick={handleSave}
                className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
              >
                <FaSave className="mr-1" />
                Save Listing
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed">{generatedText}</p>
            <button
              onClick={() => copyToClipboard(generatedText, 'listing')}
              className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FaCopy className="mr-1" />
              {copied === 'listing' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {subscription === 'pro' && (
            <div className="mb-6">
              <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Redirect URL (e.g., Zillow listing)
              </label>
              <input
                id="redirectUrl"
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="https://zillow.com/homes/12345"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add a link to track views (e.g., to a Zillow listing like 12345 Real Estate).
              </p>
            </div>
          )}

          {Object.keys(socialContent).length > 0 && subscription !== 'free' && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Social Media Content</h2>
              <div className="space-y-6">
                {(['twitter', 'instagram', 'facebook', 'linkedin'] as const).map((platform) =>
                  socialContent[platform] ? (
                    <div key={platform}>
                      <p className="font-medium text-gray-700 capitalize">{platform}:</p>
                      <p className="text-gray-600 leading-relaxed">{socialContent[platform]}</p>
                      <button
                        onClick={() => copyToClipboard(socialContent[platform], platform)}
                        className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FaCopy className="mr-1" />
                        {copied === platform ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}