import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import OpenAI from 'openai';
import connectDB from '../../lib/db';
import User from '../../models/User';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

interface GeoapifyFeature {
  properties: {
    name?: string;
    categories?: string[];
  };
}

interface POIMetrics {
  cafe: string;
  park: string;
  grocery: string;
  restaurant: string;
  school: string;
  transit: string;
}

interface SpecificPOIMetrics {
  cafe: string[];
  park: string[];
  grocery: string[];
  restaurant: string[];
  school: string[];
  transit: string[];
}

const notableCategories = [
  'sport.stadium',
  'tourism.attraction',
  'entertainment.theme_park',
  'entertainment.zoo',
  'entertainment.aquarium',
  'entertainment.museum',
  'tourism.sights',
  'national_park',
];

async function cleanupTemporaryPhotos() {
  try {
    await cloudinary.api.delete_resources_by_prefix('real-estate-temp', { resource_type: 'image' });
  } catch (error) {
    console.error('Error cleaning up temporary photos:', error);
  }
}

async function fetchGeoapifyMetrics(address?: string): Promise<{ genericMetrics: POIMetrics; specificMetrics: SpecificPOIMetrics }> {
  const defaultGenericMetrics: POIMetrics = {
    cafe: '',
    park: '',
    grocery: '',
    restaurant: '',
    school: '',
    transit: '',
  };

  const defaultSpecificMetrics: SpecificPOIMetrics = {
    cafe: [],
    park: [],
    grocery: [],
    restaurant: [],
    school: [],
    transit: [],
  };

  if (!address || !GEOAPIFY_API_KEY) {
    return { genericMetrics: defaultGenericMetrics, specificMetrics: defaultSpecificMetrics };
  }

  try {
    const geocodeResponse = await axios.get(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`
    );
    const geocodeData = geocodeResponse.data;

    if (!geocodeData.features || geocodeData.features.length === 0) {
      console.error('Geocoding failed: No features returned for address:', address);
      return { genericMetrics: defaultGenericMetrics, specificMetrics: defaultSpecificMetrics };
    }

    const { lat, lon } = geocodeData.features[0].properties || {};
    if (!lat || !lon) {
      console.error('Geocoding failed: No lat/lon found for address:', address);
      return { genericMetrics: defaultGenericMetrics, specificMetrics: defaultSpecificMetrics };
    }

    const placesResponse = await axios.get(
      `https://api.geoapify.com/v2/places?categories=catering,commercial.supermarket,leisure.park,education.school,public_transport&filter=circle:${lon},${lat},1000&limit=50&apiKey=${GEOAPIFY_API_KEY}`
    );
    const placesData = placesResponse.data;

    if (!placesData.features || !Array.isArray(placesData.features)) {
      console.error('Places API failed: No features returned for lat/lon:', lat, lon);
      return { genericMetrics: defaultGenericMetrics, specificMetrics: defaultSpecificMetrics };
    }

    const pois: GeoapifyFeature[] = placesData.features;

    const isNotable = (poi?: GeoapifyFeature) =>
      poi?.properties.categories?.some((cat) => notableCategories.includes(cat)) && poi.properties.name;

    const specificMetrics: SpecificPOIMetrics = {
      cafe: pois
        .filter((poi) => poi.properties.categories?.some((cat) => cat.includes('catering.cafe')))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
      park: pois
        .filter((poi) => poi.properties.categories?.includes('leisure.park'))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
      grocery: pois
        .filter((poi) => poi.properties.categories?.includes('commercial.supermarket'))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
      restaurant: pois
        .filter((poi) => poi.properties.categories?.some((cat) => cat.includes('catering.restaurant')))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
      school: pois
        .filter((poi) => poi.properties.categories?.includes('education.school'))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
      transit: pois
        .filter((poi) => poi.properties.categories?.some((cat) => cat.includes('public_transport')))
        .map((poi) => poi.properties.name || '')
        .filter(Boolean),
    };

    const genericMetrics: POIMetrics = {
      cafe: specificMetrics.cafe.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.some((cat) => cat.includes('catering.cafe'))))
        ? specificMetrics.cafe[0]
        : specificMetrics.cafe.length > 1
        ? 'nearby cafes'
        : specificMetrics.cafe.length === 1
        ? 'a nearby cafe'
        : '',
      park: specificMetrics.park.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.includes('leisure.park')))
        ? specificMetrics.park[0]
        : specificMetrics.park.length > 1
        ? 'local parks'
        : specificMetrics.park.length === 1
        ? 'a local park'
        : '',
      grocery: specificMetrics.grocery.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.includes('commercial.supermarket')))
        ? specificMetrics.grocery[0]
        : specificMetrics.grocery.length > 1
        ? 'local grocery stores'
        : specificMetrics.grocery.length === 1
        ? 'a local grocery store'
        : '',
      restaurant: specificMetrics.restaurant.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.some((cat) => cat.includes('catering.restaurant'))))
        ? specificMetrics.restaurant[0]
        : specificMetrics.restaurant.length > 1
        ? 'nearby restaurants'
        : specificMetrics.restaurant.length === 1
        ? 'a nearby restaurant'
        : '',
      school: specificMetrics.school.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.includes('education.school')))
        ? specificMetrics.school[0]
        : specificMetrics.school.length > 1
        ? 'nearby schools'
        : specificMetrics.school.length === 1
        ? 'a nearby school'
        : '',
      transit: specificMetrics.transit.length > 0 && isNotable(pois.find((poi) => poi.properties.categories?.some((cat) => cat.includes('public_transport'))))
        ? specificMetrics.transit[0]
        : specificMetrics.transit.length > 1
        ? 'transit stops'
        : specificMetrics.transit.length === 1
        ? 'a transit stop'
        : ''
    };

    return { genericMetrics, specificMetrics };
  } catch (error) {
    console.error('Error fetching Geoapify metrics:', error instanceof Error ? error.message : error);
    return { genericMetrics: defaultGenericMetrics, specificMetrics: defaultSpecificMetrics };
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('API keys missing');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];
  const dailyLimit = user.subscriptionStatus === 'pro' ? 25 : user.subscriptionStatus === 'basic' ? 5 : 1;
  if (user.dailyGenerations >= dailyLimit) {
    console.error('Daily limit reached for user:', session.user.email);
    return NextResponse.json({ error: 'Daily limit reached.' }, { status: 403 });
  }

  const body = await req.json();
  const { imageUrls, tone, language, location } = body;

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'At least one photo URL is required.' }, { status: 400 });
  }

  const effectiveTone = tone || 'default';
  const effectiveLanguage = language || 'English';
  const effectiveMaxWords = user.subscriptionStatus === 'free' ? 100 : 200;

  const { genericMetrics, specificMetrics } = await fetchGeoapifyMetrics(location);

  try {
    // Build the amenities string dynamically, only including non-empty genericMetrics
    const amenitiesList = Object.entries(genericMetrics)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${value} (${key})`)
      .join(', ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${imageUrls.length} photos and generate a single ${effectiveTone} real estate listing in ${effectiveLanguage}, max ${effectiveMaxWords} words. ${
                location && amenitiesList
                  ? `Incorporate these nearby amenities within 1km: ${amenitiesList}. `
                  : ''
              }Combine all details into a captivating description.${
                user.subscriptionStatus !== 'free'
                  ? ` Then, generate social media posts${location && amenitiesList ? ' including a few of these amenities' : ''}: Twitter (25 words max), Instagram (30 words max), Facebook (50 words max), LinkedIn (75 words max). Separate each section with "---" and do not include platform names or headers—just the raw text.`
                  : ''
              }`,
            },
            ...imageUrls.map((url: string) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const gptOutput = response.choices[0]?.message.content || '';

    const sections = gptOutput.split('---').map((s) => s.trim());
    const listing = sections[0] || `A beautifully designed home${location && amenitiesList ? ` near ${amenitiesList.split(', ').slice(0, 3).join(', ')}` : ''}.`;
    const socialParts = sections.slice(1);

    const cleanSocialParts = socialParts.map((part) => part.trim());
    const socialContent = user.subscriptionStatus !== 'free'
      ? {
          twitter:
            cleanSocialParts[0] ||
            (location && amenitiesList
              ? `Dream home near ${genericMetrics.cafe || genericMetrics.park || 'amenities'}! Tour now! #RealEstate`
              : 'Dream home for sale! Tour now! #RealEstate'),
          instagram:
            cleanSocialParts[1] ||
            (location && amenitiesList
              ? `Stunning retreat by ${genericMetrics.cafe || genericMetrics.grocery || 'local spots'}! #HomeGoals`
              : 'Stunning retreat for sale! #HomeGoals'),
          facebook:
            cleanSocialParts[2] ||
            (location && amenitiesList
              ? `Discover elegance near ${[genericMetrics.cafe, genericMetrics.park, genericMetrics.grocery].filter(Boolean).slice(0, 3).join(', ')}. Contact us!`
              : 'Discover this elegant home. Contact us!'),
          linkedin:
            cleanSocialParts[3] ||
            (location && amenitiesList
              ? `New listing: Modern home near ${[genericMetrics.cafe, genericMetrics.park, genericMetrics.school].filter(Boolean).slice(0, 3).join(', ')}. #RealEstate`
              : 'New listing: Modern home available. #RealEstate'),
        }
      : {};

    if (!user.lastFreeGeneration || user.lastFreeGeneration !== today) {
      user.lastFreeGeneration = today;
      user.dailyGenerations = 1;
    } else {
      user.dailyGenerations += 1;
    }
    await user.save();

    await cleanupTemporaryPhotos();

    return NextResponse.json({
      text: listing,
      social: socialContent,
      genericMetrics,
      specificMetrics,
    });
  } catch (error) {
    console.error('Error processing with GPT-4o or Geoapify:', error);
    return NextResponse.json({ error: 'Failed to generate listing.' }, { status: 500 });
  }
}