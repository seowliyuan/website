"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import QRCode from "qrcode";

export default function Home() {
  const [apkUrl, setApkUrl] = useState("#");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_APK_URL || (typeof window !== "undefined" ? window.location.href : "#");
    setApkUrl(url);
  }, []);

  useEffect(() => {
    if (apkUrl && apkUrl !== "#") {
      QRCode.toDataURL(apkUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [apkUrl]);

  useEffect(() => {
    // Page load animation
    document.body.style.opacity = "0";
    setTimeout(() => {
      document.body.style.transition = "opacity 0.8s ease-in-out";
      document.body.style.opacity = "1";
    }, 100);

    // Scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px 0px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("animate-fade-in-up");
            entry.target.classList.remove("opacity-0");
            if (entry.target instanceof HTMLElement) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              entry.target.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
            }
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Check if elements are already in viewport on load
    const checkInitialVisibility = () => {
      const elements = document.querySelectorAll(".animate-on-scroll");
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible && el.style.opacity === "0") {
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
              el.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
            }, 500);
          }
        }
      });
    };
    
    // Check after a short delay
    setTimeout(checkInitialVisibility, 1000);

    // Observe all elements with animate-on-scroll class
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        observer.observe(el);
      }
    });

    // Fallback: Make elements visible after a delay if observer doesn't trigger
    setTimeout(() => {
      elements.forEach((el) => {
        if (el instanceof HTMLElement && el.style.opacity === "0") {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
        }
      });
    }, 2000);

    // Smooth scroll behavior for anchor links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", handleSmoothScroll);
    });

    return () => {
      observer.disconnect();
      links.forEach((link) => {
        link.removeEventListener("click", handleSmoothScroll);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white text-black overflow-x-hidden">
      {/* Navigation - Premium Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <Image 
                src="/app_logo.png" 
                alt="NutriTrack Logo" 
                width={40}
                height={40}
                className="rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                unoptimized
              />
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              NutriTrack
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#download" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 relative group">
              Download
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#download"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Style */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-6 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* App Logo - Large */}
          <div className="mb-10 flex justify-center animate-zoom-in animate-float">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <Image 
                src="/app_logo.png" 
                alt="NutriTrack Logo" 
                width={140}
                height={140}
                className="relative rounded-3xl shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-3"
                unoptimized
                priority
              />
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold mb-8 leading-tight tracking-tight">
            <span className="block text-gray-900 animate-fade-in-up">Track Your</span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Nutrition
            </span>
            <span className="block text-gray-700 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Instantly</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            AI-powered food recognition for Malaysian cuisine. 
            <br className="hidden md:block" />
            Discover calories, macros, and nutritional insights with just a photo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <a
              href="#download"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold text-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Now
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              Learn More
            </a>
          </div>
            
          {/* Hero Phone Mockup */}
          <div className="flex justify-center animate-zoom-in" style={{ animationDelay: '0.6s' }}>
            <div className="relative w-[300px] md:w-[380px] lg:w-[420px] group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-[3.5rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative aspect-[9/19] rounded-[3rem] border-[12px] border-gray-900 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                <Image 
                  src="/flutter_01.png" 
                  alt="NutriTrack App" 
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Premium Style */}
      <section id="features" ref={featuresRef} className="py-32 px-6 bg-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-on-scroll">
            <div className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 animate-fade-in-up">
              Features
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Everything you need.
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Powerful features to help you achieve your nutrition goals.
            </p>
          </div>

          {/* Three Screenshots Grid */}
          <div className="grid md:grid-cols-3 gap-10 mb-24">
            {/* AI Assistant */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                  <Image 
                    src="/flutter_37.png" 
                    alt="AI Nutrition Assistant" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">AI Assistant</h3>
              <p className="text-lg text-gray-600 font-light leading-relaxed max-w-sm mx-auto">
                Get instant nutrition advice and meal recommendations powered by advanced AI.
              </p>
            </div>

            {/* Leaderboard */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                  <Image 
                    src="/flutter_33.png" 
                    alt="Leaderboard" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Leaderboard</h3>
              <p className="text-lg text-gray-600 font-light leading-relaxed max-w-sm mx-auto">
                Compete with friends and track your progress in groups with real-time rankings.
              </p>
            </div>

            {/* Add Meal */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                  <Image 
                    src="/flutter_04.png" 
                    alt="Add Meal" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Food Recognition</h3>
              <p className="text-lg text-gray-600 font-light leading-relaxed max-w-sm mx-auto">
                Simply take a photo to identify food and get instant nutritional information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section - Premium Style */}
      <section id="download" ref={downloadRef} className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="animate-on-scroll animate-fade-in-up">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-sm font-semibold mb-6">
              Download
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Get started today.
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-16 font-light max-w-3xl mx-auto">
              Download the app and start tracking your nutrition in minutes.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-20">
            {/* QR Code */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white p-8 rounded-3xl shadow-2xl mb-6 transition-all duration-300 group-hover:scale-105">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-[220px] h-[220px] transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <div className="w-[220px] h-[220px] bg-gray-100 flex items-center justify-center rounded-lg animate-pulse-slow">
                      <div className="text-gray-400 text-sm">Loading...</div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-lg text-gray-700 font-medium">Scan to download</p>
            </div>

            {/* Direct Download */}
            <div className="text-center animate-on-scroll animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <a
                href={apkUrl}
                download
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white text-lg font-bold hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110 mb-6 group"
              >
                <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download APK
              </a>
              <div className="text-sm text-gray-500 space-y-2 font-light">
                <p>✓ Android 5.0+ required</p>
                <p>✓ Free to download</p>
                <p>✓ No account needed</p>
              </div>
            </div>
          </div>

          {/* Additional Info Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-16 border-t border-gray-200">
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Easy Setup</h4>
              <p className="text-gray-600 font-light leading-relaxed">
                Install the APK and start using the app immediately. No complicated setup required.
              </p>
            </div>
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Privacy First</h4>
              <p className="text-gray-600 font-light leading-relaxed">
                Your data stays on your device. We respect your privacy and never share your information.
              </p>
            </div>
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Regular Updates</h4>
              <p className="text-gray-600 font-light leading-relaxed">
                Get the latest features and improvements with regular app updates and new food additions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Premium Style */}
      <footer className="py-16 px-6 border-t border-gray-200 bg-white animate-on-scroll animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image 
                src="/app_logo.png" 
                alt="NutriTrack Logo" 
                width={48}
                height={48}
                className="rounded-xl transition-transform duration-300 hover:scale-110 hover:rotate-3"
                unoptimized
              />
              <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                NutriTrack
              </div>
            </div>
            <p className="text-gray-600 font-light">
              © {new Date().getFullYear()} NutriTrack. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2 font-light">
              Made with ❤️ for better nutrition tracking
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
