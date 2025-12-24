"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { useTheme } from "next-themes";

export default function Home() {
  const [apkUrl, setApkUrl] = useState("#");
  const [apkVersion, setApkVersion] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Theme management using next-themes
  useEffect(() => {
    setMounted(true);
    console.log('🌓 ===== THEME INITIALIZATION =====');
    console.log('📦 Current theme:', theme);
    console.log('🎯 Resolved theme:', resolvedTheme);
    console.log('🏷️  HTML classes:', document.documentElement.className);
    console.log('🔍 Has "dark" class:', document.documentElement.classList.contains('dark'));
    console.log('🌓 ===== END THEME INIT =====\n');
  }, [theme, resolvedTheme]);

  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('🔄 ===== TOGGLE THEME =====');
    console.log('📊 Current theme:', currentTheme);
    console.log('🎯 New theme:', newTheme);
    console.log('🏷️  HTML classes before:', document.documentElement.className);
    
    setTheme(newTheme);
    
    setTimeout(() => {
      console.log('✅ Theme changed to:', newTheme);
      console.log('🏷️  HTML classes after:', document.documentElement.className);
      console.log('🔍 Has "dark" class:', document.documentElement.classList.contains('dark'));
      console.log('🎨 Current mode:', newTheme === 'dark' ? '🌙 DARK' : '☀️ LIGHT');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      console.log('🎨 Body background color:', bodyBg);
      console.log('🔄 ===== END TOGGLE =====\n');
    }, 100);
  };

  const isDarkMode = resolvedTheme === 'dark';

  // Fetch latest APK version from backend
  const fetchLatestApk = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      console.log("Fetching APK from:", `${backendUrl}/apk/latest`);
      const response = await fetch(`${backendUrl}/apk/latest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("APK data received:", data);
      
      if (data.success && data.apk && data.apk.github_url) {
        setApkUrl(data.apk.github_url);
        setApkVersion(data.apk.version || "");
        console.log("APK URL set to:", data.apk.github_url);
      } else {
        console.warn("No APK found in response, using fallback");
        // Fallback to environment variable if API fails
        const fallbackUrl = process.env.NEXT_PUBLIC_APK_URL || "#";
        setApkUrl(fallbackUrl);
      }
    } catch (err) {
      console.error("Error fetching latest APK:", err);
      // Fallback to environment variable if API fails
      const fallbackUrl = process.env.NEXT_PUBLIC_APK_URL || "#";
      setApkUrl(fallbackUrl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch latest APK on mount
    fetchLatestApk();

    // Set up periodic check for updates (every 5 minutes)
    const interval = setInterval(() => {
      fetchLatestApk();
    }, 5 * 60 * 1000); // 5 minutes

    // Also check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLatestApk();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-black dark:text-white overflow-x-hidden transition-colors duration-300">
      {/* Navigation - Apple Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left side - Logo */}
            <div className="flex items-center gap-2 flex-1">
              <Image 
                src="/app_logo.png" 
                alt="NutriTrack" 
                width={28}
                height={28}
                className="rounded-lg"
                unoptimized
              />
              <span className="text-base font-medium text-gray-900 dark:text-white">NutriTrack</span>
            </div>
            
            {/* Center - Navigation Links */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#download" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Download
              </a>
            </div>
            
            {/* Right side - Theme Toggle */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                  aria-label="Toggle theme"
                  title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {/* Debug indicator - shows current mode */}
                  <span 
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-blue-500'}`} 
                    title={`Current mode: ${isDarkMode ? '🌙 DARK' : '☀️ LIGHT'}`}
                  ></span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Apple Style */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          {/* Product Name - Apple Style */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-white">
            NutriTrack
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Track your nutrition.<br />Instantly.
          </p>

          {/* Hero Phone Mockup - Centered, Large */}
          <div className="flex justify-center mb-16">
            <div className="relative w-full max-w-[400px] md:max-w-[500px]">
              <div className="relative aspect-[9/19] rounded-[3rem] border-[14px] border-gray-900 dark:border-gray-800 overflow-hidden bg-black shadow-2xl">
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

          {/* CTA Button - Apple Style */}
          <div className="flex flex-col items-center gap-4">
            <a
              href="#download"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Download
            </a>
            <a
              href="#features"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Features Section - Apple Style */}
      <section id="features" ref={featuresRef} className="py-24 md:py-32 px-6 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Section Header - Apple Style */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-white">
              Get the highlights.
            </h2>
          </div>

          {/* Three Screenshots Grid */}
          <div className="grid md:grid-cols-3 gap-10 mb-24">
            {/* AI Assistant */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gray-100 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
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
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-sm mx-auto">
                Get instant nutrition advice and meal recommendations powered by advanced AI.
              </p>
            </div>

            {/* Leaderboard */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 dark:border-gray-700 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                  <Image 
                    src="/flutter_33.png" 
                    alt="Leaderboard" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Leaderboard</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-sm mx-auto">
                Compete with friends and track your progress in groups with real-time rankings.
              </p>
            </div>

            {/* Add Meal */}
            <div className="text-center animate-on-scroll group animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="relative w-full max-w-[300px] mx-auto mb-8">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-gray-900 dark:border-gray-700 shadow-2xl overflow-hidden bg-black transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                  <Image 
                    src="/flutter_04.png" 
                    alt="Add Meal" 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Food Recognition</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-sm mx-auto">
                Simply take a photo to identify food and get instant nutritional information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section - Apple Style */}
      <section id="download" ref={downloadRef} className="py-24 md:py-32 px-6 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-white">
            Download
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Get started in minutes. Scan the QR code or download directly.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-16 mb-16">
            {/* QR Code - Apple Style */}
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-4 inline-block">
                {loading || !qrCodeDataUrl ? (
                  <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg animate-pulse">
                    <div className="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
                  </div>
                ) : (
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-[200px] h-[200px]" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scan to download</p>
              {apkVersion && (
                <p className="text-xs text-gray-500 dark:text-gray-500">Version {apkVersion}</p>
              )}
            </div>

            {/* Direct Download - Apple Style */}
            <div className="text-center">
              <a
                href={apkUrl}
                download
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors mb-4"
              >
                {loading ? 'Loading...' : 'Download APK'}
              </a>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Android 5.0+ required</p>
                <p>Free to download</p>
              </div>
            </div>
          </div>

          {/* Additional Info Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-16 border-t border-gray-200 dark:border-gray-700">
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Easy Setup</h4>
              <p className="text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Install the APK and start using the app immediately. No complicated setup required.
              </p>
            </div>
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Privacy First</h4>
              <p className="text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Your data stays on your device. We respect your privacy and never share your information.
              </p>
            </div>
            <div className="text-left animate-on-scroll p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Regular Updates</h4>
              <p className="text-gray-600 dark:text-gray-300 font-light leading-relaxed">
                Get the latest features and improvements with regular app updates and new food additions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Section - Social Links */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900 dark:text-white">
              Connect with Me
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Let&apos;s connect and explore opportunities together
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {/* GitHub */}
            <a
              href="https://github.com/seowliyuan?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 min-w-[140px]"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                GitHub
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                View Repositories
              </span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/li-yuan-36708720b/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 min-w-[140px]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                LinkedIn
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Professional Profile
              </span>
            </a>

            {/* Jobstreet */}
            <a
              href="https://my.jobstreet.com/profiles/seow-liyuan-DfVwx4Ltks"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300 min-w-[140px]"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                Jobstreet
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Career Profile
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Apple Style */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} NutriTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
