import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-blue-700 bg-gradient-to-r from-blue-600 to-blue-800 [-webkit-gradient(linear,_left_top,_right_top,_from(#2563eb),_to(#1e40af))] text-white py-28 px-4 sm:px-6 lg:px-8 home-hero">
        <div className="bg-blue-700 bg-gradient-to-r from-blue-600 to-blue-800 [-webkit-gradient(linear,_left_top,_right_top,_from(#2563eb),_to(#1e40af))] absolute inset-0 opacity-75"></div>
        <div className="max-w-5xl mx-auto text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Turn Your Photos into Listings That Sell
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-6 max-w-3xl mx-auto">
            Snap a photo, and let your personal AI copywriter craft stunning listings and scroll-stopping social posts—instantly, professionally, yours to own.
          </p>
          <p className="text-lg text-amber-200 mb-10 font-semibold">
            Sign up today for a <span className="underline">1-month free trial</span> of Pro features!
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/pricing"
              className="bg-white hover:bg-gray-100 text-[#4861C3] px-8 py-4 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Explore Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Your Professional Copywriter, Powered by AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Listings That Shine</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your photos, and watch your AI craft vivid, polished descriptions that make properties irresistible. <span className="text-green-600 font-medium">Pro: Save up to 500 listings!</span>
              </p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933A4 4 0 006 10.333z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Social Posts That Pop</h3>
              <p className="text-gray-600 leading-relaxed">
                From one photo, get tailored posts for every platform—crafted to spark engagement. <span className="text-green-600 font-medium">Pro: Optimized posts + analytics!</span>
              </p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.87a4 4 0 10-4.954 0c.27.223.462.53.477.87h4z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Pro Writing, Zero Effort</h3>
              <p className="text-gray-600 leading-relaxed">
                Skip writer’s block—your AI delivers expert content in seconds. <span className="text-green-600 font-medium">Pro: 25 generations/day—try it free for 30 days!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Unlock Pro Features with a 1-Month Free Trial
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Upload a photo, and let your AI copywriter work its magic. Stunning listings, killer social posts—free for 30 days with Pro.
          </p>
          <Link
            href="/auth/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Your Free Trial Today
          </Link>
        </div>
      </section>
    </div>
  );
}