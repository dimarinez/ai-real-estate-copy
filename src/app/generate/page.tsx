'use client';

import { useState, useEffect } from 'react';

export default function GenerateListing() {
    const [propertyType, setPropertyType] = useState('');
    const [location, setLocation] = useState('');
    const [features, setFeatures] = useState('');
    const [tone, setTone] = useState('default');
    const [language, setLanguage] = useState('English');
    const [generatedText, setGeneratedText] = useState('');
    const [socialContent, setSocialContent] = useState({ twitter: '', instagram: '', facebook: '', linkedin: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [subscription, setSubscription] = useState('free'); // Default to free tier

    useEffect(() => {
        // Fetch user subscription status (Replace with actual API call)
        async function fetchSubscription() {
            const res = await fetch('/api/user/subscription');
            const data = await res.json();
            setSubscription(data.subscriptionStatus || 'free');
        }
        fetchSubscription();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setMessage('');
        setGeneratedText('');
        setSocialContent({ twitter: '', instagram: '', facebook: '', linkedin: '' });

        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propertyType,
                location,
                features: features.split(',').map((f) => f.trim()),
                tone,
                language
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (data.text) {
            setGeneratedText(data.text);
            setSocialContent(data.social || {});
        } else {
            setMessage(data.error);
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
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Generate Real Estate Copy</h1>

            <input
                type="text"
                placeholder="Property Type (e.g., House, Apartment)"
                className="border p-2 mb-2 w-96"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
            />
            <input
                type="text"
                placeholder="Location (e.g., New York, LA)"
                className="border p-2 mb-2 w-96"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <input
                type="text"
                placeholder="Features (comma-separated, e.g., Pool, Garage, Fireplace)"
                className="border p-2 mb-4 w-96"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
            />

            <select 
                onChange={(e) => setTone(e.target.value)} 
                className="border p-2 mb-2 w-96"
                disabled={subscription === 'free'} // Disable for free users
            >
                <option value="default">Default Tone</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
            </select>

            <select 
                onChange={(e) => setLanguage(e.target.value)} 
                className="border p-2 mb-4 w-96"
                disabled={subscription === 'free'} // Disable for free users
            >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
            </select>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2"
            >
                {loading ? 'Generating...' : 'Generate Copy'}
            </button>

            {message && <p className="mt-4 text-red-500">{message}</p>}

            {generatedText && (
                <div className="mt-6 p-4 border rounded bg-gray-100 max-w-lg">
                    <h2 className="text-lg font-bold">Generated Listing:</h2>
                    <p>{generatedText}</p>
                    <button onClick={handleSaveListing} className="mt-4 bg-green-500 text-white px-4 py-2">
                        Save Listing
                    </button>
                </div>
            )}

            {subscription !== 'free' && socialContent.twitter && (
                <div className="mt-6 p-4 border rounded bg-gray-100 max-w-lg">
                    <h2 className="text-lg font-bold">Social Media Content:</h2>
                    <p><strong>Twitter:</strong> {socialContent.twitter}</p>
                    <p><strong>Instagram:</strong> {socialContent.instagram}</p>
                    <p><strong>Facebook:</strong> {socialContent.facebook}</p>
                    <p><strong>LinkedIn:</strong> {socialContent.linkedin}</p>
                </div>
            )}
        </div>
    );
}
