"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast ? (
              <span className="text-gray-300 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-gray-200 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

