// src/app/components/GenerateListing.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaCopy, FaSave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { Autocomplete, useLoadScript, Libraries } from '@react-google-maps/api';
import imageCompression from 'browser-image-compression';
import { useDropzone } from 'react-dropzone';

type Heic2Any = (options: {
  blob: Blob;
  toType?: string;
  quality?: number;
  gifInterval?: number;
  multiple?: boolean;
}) => Promise<Blob | Blob[]>;

let heic2anyPromise: Promise<Heic2Any> | null = null;
const loadHeic2any = () => {
  if (!heic2anyPromise) {
    heic2anyPromise = import('heic2any').then((module) => module.default as Heic2Any);
  }
  return heic2anyPromise;
};

const libraries: Libraries = ['places'];

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
  const [message, setMessage] = useState(''); // General messages (e.g., errors)
  const [saveMessage, setSaveMessage] = useState(''); // Save-specific feedback
  const [isSaved, setIsSaved] = useState(false); // Track if this listing is saved
  const [subscription, setSubscription] = useState<string | null>(null);
  const [savedListingsCount, setSavedListingsCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false); // Hydration safety

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS || '',
    libraries,
  });

  useEffect(() => {
    setIsMounted(true);
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
        setMessage('Failed to load user data. Some features may be unavailable.');
      }
    }
    fetchUserData();
  }, []);

  const handleFileChange = async (acceptedFiles: File[]) => {
    // ... (unchanged, keep existing logic)
    if (!acceptedFiles || acceptedFiles.length === 0) {
      setMessage('No files selected.');
      return;
    }

    const now = Date.now();
    const maxAgeSeconds = 30;

    const libraryFiles = acceptedFiles.filter((file) => {
      const ageInSeconds = (now - file.lastModified) / 1000;
      if (ageInSeconds < maxAgeSeconds) {
        console.log(`Rejected ${file.name}: Appears to be a new photo (${ageInSeconds}s old). Use library photos instead.`);
        return false;
      }
      return true;
    });

    if (libraryFiles.length === 0) {
      setMessage('Please select photos from your library, not new camera shots.');
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    setLoading(true);
    setLoadingMessage('Processing photos…');

    try {
      const processedFiles = await Promise.all(
        libraryFiles.map(async (file, index) => {
          try {
            console.log(`Processing file ${index + 1}/${libraryFiles.length}: ${file.name}`);
            console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

            let fileToCompress = file;
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
              console.log(`Converting HEIC: ${file.name}`);
              const heic2any = await loadHeic2any();
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8,
              });
              const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              fileToCompress = new File([blob], `${file.name.replace(/\.heic$/i, '.jpg')}`, {
                type: 'image/jpeg',
              });
              console.log(`Converted size: ${(fileToCompress.size / 1024 / 1024).toFixed(2)} MB`);
            }

            const compressedFile = await imageCompression(fileToCompress, options);
            console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            return compressedFile;
          } catch (err) {
            console.error(`Error processing ${file.name}:`, err);
            return null;
          }
        })
      );

      const validFiles = processedFiles.filter((file): file is File => file !== null);
      if (validFiles.length === 0) {
        throw new Error('No valid photos processed. Check file formats.');
      }

      if (validFiles.length > 10) {
        setMessage('Maximum 10 photos allowed. Only the first 10 will be used.');
        setPhotos(validFiles.slice(0, 10));
      } else {
        setPhotos(validFiles);
        setMessage(`${validFiles.length} photo${validFiles.length === 1 ? '' : 's'} ready.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error processing images. Try different files.');
      console.error('Processing batch error:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileChange,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.heic'],
    },
    multiple: true,
    maxFiles: 10,
    disabled: loading,
  });

  const handleGenerate = async () => {
    // ... (unchanged, keep existing logic)
    if (photos.length === 0) {
      setMessage('Please upload at least one property photo.');
      return;
    }

    const maxGenerations = subscription === 'pro' ? 25 : subscription === 'basic' ? 5 : 1;
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
    setIsSaved(false); // Reset save state on new generation
    setSaveMessage('');

    setLoadingMessage('Uploading photos…');

    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });
    formData.append('photoCount', photos.length.toString());

    try {
      const uploadRes = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || `Upload failed with status ${uploadRes.status}`);
      }

      const imageUrls = uploadData.imageUrls;

      setLoadingMessage('Generating content…');

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          tone,
          language,
        }),
      });

      const generateData = await generateRes.json();
      setLoading(false);

      if (generateData.text) {
        setGeneratedText(generateData.text);
        if (subscription !== 'free') {
          setSocialContent(generateData.social || { twitter: '', instagram: '', facebook: '', linkedin: '' });
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
        setMessage(generateData.error || 'Failed to generate content');
      }
    } catch (error) {
      setLoading(false);
      setMessage('Failed to process request. Try again.');
      console.error('Fetch error:', error);
    }
  };

  const handleSave = async () => {
    const maxSaved = subscription === 'pro' ? 500 : subscription === 'basic' ? 10 : 5;
    if (savedListingsCount >= maxSaved) {
      setSaveMessage(`You’ve reached your limit of ${maxSaved} saved listings. Upgrade or delete existing listings.`);
      return;
    }

    if (isSaved) {
      setSaveMessage('This listing has already been saved.');
      return;
    }

    const trackableId = Date.now().toString();
    const trackableUrl = subscription === 'pro' ? `/listing/${trackableId}` : undefined;

    try {
      const res = await fetch('/api/listings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: location || `${generatedText.split(' ').slice(0, 5).join(' ')} Listing`,
          description: generatedText,
          location,
          social: subscription !== 'free' ? socialContent : undefined,
          analytics: subscription === 'pro' ? { trackableUrl, redirectUrl, views: 0 } : undefined,
        }),
      });

      const data = await res.json();
      const message = trackableUrl 
  ? `Track it at ${process.env.NEXT_PUBLIC_URL}${trackableUrl}` 
  : 'Track it at your dashboard';
      if (res.ok) {
        setSavedListingsCount((prev) => prev + 1);
        setIsSaved(true);
        setSaveMessage(`Listing saved successfully! ${message}.`);
      } else {
        setSaveMessage(data.error || 'Failed to save listing');
      }
    } catch (error) {
      setSaveMessage('Error saving listing. Try again.');
      console.error('Save error:', error);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getMessageStyles = (msg: string) => {
    if (msg.includes('successfully')) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (
      msg.includes('upload') ||
      msg.includes('number') ||
      msg.includes('process') ||
      msg.includes('save listing') ||
      msg.includes('generate content') ||
      msg.includes('camera shots') ||
      msg.includes('already been saved')
    ) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Hydration-safe initial render
  if (!isMounted || !isLoaded || subscription === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">
            {isLoaded ? 'Loading your data...' : 'Loading Google Maps...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-10 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Create Your Real Estate Listing</h1>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-xl z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-700 font-medium">{loadingMessage}</p>
            </div>
          </div>
        )}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-2 animate-fade-in ${getMessageStyles(message)}`}>
            {message.includes('successfully') ? (
              <FaCheckCircle className="text-green-600" />
            ) : message.includes('upload') ||
              message.includes('number') ||
              message.includes('process') ||
              message.includes('save listing') ||
              message.includes('generate content') ||
              message.includes('camera shots') ? (
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
          </div>
        )}
        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Photos (Max 10, Select from Library)
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : loading
                  ? 'border-gray-300 bg-gray-200 cursor-not-allowed'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-blue-600">Drop your photos here...</p>
              ) : (
                <p className="text-gray-600">
                  Drag and drop photos here, or click to select from your library
                </p>
              )}
            </div>
            {photos.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">{photos.length}/10 photos selected</p>
            )}
          </div>

          {subscription !== 'free' && (
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
          )}

          {subscription !== 'free' && (
            <div className="relative">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Russian">Russian</option>
                <option value="Arabic">Arabic</option>
                <option value="Hindi">Hindi</option>
                <option value="Turkish">Turkish</option>
                <option value="Dutch">Dutch</option>
                <option value="Swedish">Swedish</option>
              </select>
            </div>
          )}

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

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-6 bg-blue-600 bg-gradient-blue text-white rounded-lg font-semibold hover:bg-blue-700 hover:bg-gradient-blue-hover disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md"
          >
            {loading ? 'Generating…' : 'Generate Listing'}
          </button>
        </div>
      </div>

      {generatedText && (
        <div className="mt-8 bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Generated Listing</h2>
              <button
                onClick={handleSave}
                disabled={loading || isSaved}
                className={`flex items-center text-sm transition-colors ${
                  isSaved ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'
                }`}
              >
                <FaSave className="mr-1" />
                {isSaved ? 'Saved' : 'Save Listing'}
              </button>
            </div>
            {saveMessage && (
              <div
                className={`mb-4 p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center gap-2 ${getMessageStyles(
                  saveMessage
                )}`}
              >
                {saveMessage.includes('successfully') ? (
                  <FaCheckCircle className="text-green-600 shrink-0" />
                ) : (
                  <FaExclamationCircle className="text-red-600 shrink-0" />
                )}
                <p className="flex-1 break-all md:break-normal text-sm sm:text-base">{saveMessage}</p>
                {saveMessage.includes('limit') && (
                  <a
                    href="/pricing"
                    className="text-blue-600 hover:underline whitespace-nowrap mt-2 sm:mt-0"
                  >
                    Upgrade Now
                  </a>
                )}
                {saveMessage.includes('saved') && saveMessage.includes('Track') && (
                  <a
                    href="/dashboard"
                    className="text-blue-600 hover:underline whitespace-nowrap mt-2 sm:mt-0"
                  >
                    Go to Dashboard
                  </a>
                )}
              </div>
            )}
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
                disabled={isSaved} // Disable after saving to prevent confusion
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
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