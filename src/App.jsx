import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import MehendiBackground from './MehendiBackground.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllPublicData, subscribeCMSUpdates } from './lib/db.js';
import {
  Send,
  Mail,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Feather,
  Flower,
  Crown,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

// Custom brand SVGs because brand logos are removed from modern lucide-react
const Instagram = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsApp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Memoized decorative SVG components ───────────────────────────────────────
// Wrapped in memo() so they never re-render unless props change

const MandalaCornerSVG = memo(({ className }) => (
  <svg
    viewBox="0 0 200 200"
    className={`fill-none ${className}`}
    role="presentation"
    aria-hidden="true"
  >
    {/* Concentric rings */}
    <circle cx="0" cy="0" r="190" stroke="#E8DDC7" strokeWidth="0.5" strokeDasharray="4,4" />
    <circle cx="0" cy="0" r="170" stroke="#E8DDC7" strokeWidth="0.75" />
    <circle cx="0" cy="0" r="150" stroke="#B89A5A" strokeWidth="0.75" strokeDasharray="2,2" />
    <circle cx="0" cy="0" r="130" stroke="#E8DDC7" strokeWidth="0.75" />
    <circle cx="0" cy="0" r="110" stroke="#B89A5A" strokeWidth="0.75" />
    <circle cx="0" cy="0" r="90" stroke="#E8DDC7" strokeWidth="0.75" strokeDasharray="3,3" />
    <circle cx="0" cy="0" r="70" stroke="#B89A5A" strokeWidth="1" />
    <circle cx="0" cy="0" r="50" stroke="#E8DDC7" strokeWidth="0.75" />
    <circle cx="0" cy="0" r="30" stroke="#B89A5A" strokeWidth="1.5" />
    <circle cx="0" cy="0" r="15" fill="#E8DDC7" opacity="0.1" />

    {/* Quarter-circle rays */}
    {[...Array(32)].map((_, i) => {
      const angle = (i * 90) / 32;
      const rad = (angle * Math.PI) / 180;
      const x1 = 30 * Math.cos(rad);
      const y1 = 30 * Math.sin(rad);
      const x2 = 170 * Math.cos(rad);
      const y2 = 170 * Math.sin(rad);
      return (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8DDC7" strokeWidth="0.5" />
          <circle cx={x2} cy={y2} r="1.2" fill="#B89A5A" />
        </g>
      );
    })}

    {/* Outer lace scallops */}
    {[...Array(16)].map((_, i) => {
      const angle = (i * 90) / 16;
      const rad = (angle * Math.PI) / 180;
      const x = 110 * Math.cos(rad);
      const y = 110 * Math.sin(rad);
      return (
        <circle key={i} cx={x} cy={y} r="3" stroke="#B89A5A" strokeWidth="0.5" />
      );
    })}

    <path d="M 0 50 A 50 50 0 0 1 50 0" stroke="#B89A5A" strokeWidth="1" />
    <path d="M 0 90 A 90 90 0 0 1 90 0" stroke="#E8DDC7" strokeWidth="0.75" />
    <path d="M 0 130 A 130 130 0 0 1 130 0" stroke="#B89A5A" strokeWidth="0.75" />
  </svg>
));
MandalaCornerSVG.displayName = 'MandalaCornerSVG';

const LargeMandala = memo(({ className, style }) => (
  <svg viewBox="0 0 300 300" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <circle cx="150" cy="150" r="6" fill="#B89A5A" />
    <circle cx="150" cy="150" r="15" strokeWidth="1.2" />
    {[...Array(8)].map((_, i) => (
      <path key={`p1-${i}`} d="M 150 138 C 145 130, 155 130, 150 138 Z" transform={`rotate(${i * 45} 150 150)`} strokeWidth="1" />
    ))}
    <circle cx="150" cy="150" r="28" strokeDasharray="2,2" />
    <circle cx="150" cy="150" r="38" strokeWidth="1" />
    {[...Array(16)].map((_, i) => {
      const angle = (i * 360) / 16;
      const rad = (angle * Math.PI) / 180;
      return <circle key={`dot1-${i}`} cx={150 + 38 * Math.cos(rad)} cy={150 + 38 * Math.sin(rad)} r="1.5" fill="#E8DDC7" />;
    })}
    <circle cx="150" cy="150" r="54" />
    {[...Array(24)].map((_, i) => (
      <path key={`scallop1-${i}`} d="M 150 96 C 145 88, 155 88, 150 96" transform={`rotate(${i * 15} 150 150)`} />
    ))}
    <circle cx="150" cy="150" r="72" strokeWidth="1" strokeDasharray="3,3" />
    <circle cx="150" cy="150" r="88" strokeWidth="1.2" />
    {[...Array(32)].map((_, i) => {
      const angle = (i * 360) / 32;
      const rad = (angle * Math.PI) / 180;
      return (
        <line key={`ray-${i}`} x1={150 + 88 * Math.cos(rad)} y1={150 + 88 * Math.sin(rad)} x2={150 + 104 * Math.cos(rad)} y2={150 + 104 * Math.sin(rad)} />
      );
    })}
    <circle cx="150" cy="150" r="104" strokeWidth="0.8" />
    <circle cx="150" cy="150" r="120" strokeWidth="1" />
    {[...Array(48)].map((_, i) => {
      const angle = (i * 360) / 48;
      const rad = (angle * Math.PI) / 180;
      return (
        <circle key={`dot2-${i}`} cx={150 + 120 * Math.cos(rad)} cy={150 + 120 * Math.sin(rad)} r="1" fill="#B89A5A" />
      );
    })}
    <circle cx="150" cy="150" r="132" strokeWidth="1.5" />
    {[...Array(36)].map((_, i) => (
      <path key={`scallop2-${i}`} d="M 150 18 C 142 6, 158 6, 150 18" transform={`rotate(${i * 10} 150 150)`} />
    ))}
  </svg>
));
LargeMandala.displayName = 'LargeMandala';

const SmallMandala = memo(({ className, style }) => (
  <svg viewBox="0 0 160 160" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <circle cx="80" cy="80" r="4" fill="#B89A5A" />
    <circle cx="80" cy="80" r="10" strokeWidth="1" />
    {[...Array(8)].map((_, i) => (
      <path key={`sm-petal-${i}`} d="M 80 70 C 77 65, 83 65, 80 70" transform={`rotate(${i * 45} 80 80)`} />
    ))}
    <circle cx="80" cy="80" r="22" strokeDasharray="2,2" />
    <circle cx="80" cy="80" r="32" />
    {[...Array(16)].map((_, i) => (
      <path key={`sm-scallop-${i}`} d="M 80 48 C 77 44, 83 44, 80 48" transform={`rotate(${i * 22.5} 80 80)`} />
    ))}
    <circle cx="80" cy="80" r="48" strokeWidth="1" />
    <circle cx="80" cy="80" r="56" strokeWidth="1.2" strokeDasharray="3,3" />
    <circle cx="80" cy="80" r="66" strokeWidth="1" />
    {[...Array(24)].map((_, i) => {
      const rad = (i * 360 / 24) * Math.PI / 180;
      return <circle key={`sm-dot-${i}`} cx={80 + 66 * Math.cos(rad)} cy={80 + 66 * Math.sin(rad)} r="1" fill="#B89A5A" />;
    })}
    <circle cx="80" cy="80" r="74" />
  </svg>
));
SmallMandala.displayName = 'SmallMandala';

const Paisley = memo(({ className, style }) => (
  <svg viewBox="0 0 200 280" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <path d="M 180 260 C 120 250, 70 200, 90 130 C 105 80, 80 30, 60 50 C 40 70, 70 110, 50 140 C 30 170, 10 200, 5 260" strokeWidth="1.2" />
    <path d="M 170 255 C 115 245, 75 195, 93 132 C 107 88, 85 45, 68 62 C 50 82, 72 118, 55 145 C 38 172, 20 200, 15 255" strokeWidth="0.8" strokeDasharray="2,2" />
    <circle cx="120" cy="200" r="24" strokeWidth="0.8" />
    <circle cx="120" cy="200" r="14" strokeWidth="0.8" />
    <circle cx="120" cy="200" r="5" fill="#B89A5A" />
    {[...Array(8)].map((_, i) => {
      const rad = (i * Math.PI) / 4;
      return (
        <circle key={`p-dot-${i}`} cx={120 + 19 * Math.cos(rad)} cy={200 + 19 * Math.sin(rad)} r="1.2" fill="#E8DDC7" />
      );
    })}
    <path d="M 60 50 C 70 30, 50 10, 30 5 C 10 0, 15 20, 25 30" />
    <path d="M 65 95 C 55 80, 40 90, 42 100" />
    <path d="M 55 110 C 45 98, 30 108, 35 118" />
  </svg>
));
Paisley.displayName = 'Paisley';

const FlowerCluster = memo(({ className, style }) => (
  <svg viewBox="0 0 100 100" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <circle cx="50" cy="50" r="5" fill="#B89A5A" />
    <circle cx="50" cy="50" r="10" />
    {[...Array(6)].map((_, i) => (
      <path key={`fc-petal-1-${i}`} d="M 50 40 C 46 32, 54 32, 50 40" transform={`rotate(${i * 60} 50 50)`} />
    ))}
    <g transform="translate(25, 30)">
      <circle cx="0" cy="0" r="2.5" fill="#B89A5A" />
      <circle cx="0" cy="0" r="5" />
      {[...Array(5)].map((_, i) => (
        <path key={`fc-petal-2-${i}`} d="M 0 -5 C -2.5 -9, 2.5 -9, 0 -5" transform={`rotate(${i * 72} 0 0)`} />
      ))}
    </g>
    <g transform="translate(70, 65)">
      <circle cx="0" cy="0" r="2.5" fill="#B89A5A" />
      <circle cx="0" cy="0" r="5" />
      {[...Array(5)].map((_, i) => (
        <path key={`fc-petal-3-${i}`} d="M 0 -5 C -2.5 -9, 2.5 -9, 0 -5" transform={`rotate(${i * 72} 0 0)`} />
      ))}
    </g>
    <path d="M 32 38 C 40 45, 45 42, 50 45" />
    <path d="M 68 62 C 60 55, 55 58, 50 55" />
  </svg>
));
FlowerCluster.displayName = 'FlowerCluster';

const LeafCluster = memo(({ className, style }) => (
  <svg viewBox="0 0 80 80" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <path d="M 40 40 C 30 25, 20 20, 30 10 C 38 15, 38 30, 40 40 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 40 40 C 50 25, 60 20, 50 10 C 42 15, 42 30, 40 40 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 40 40 C 25 45, 20 55, 10 45 C 15 37, 30 37, 40 40 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 40 40 C 55 45, 60 55, 70 45 C 65 37, 50 37, 40 40 Z" fill="#B89A5A" fillOpacity="0.05" />
    <circle cx="40" cy="40" r="3" fill="#E8DDC7" />
  </svg>
));
LeafCluster.displayName = 'LeafCluster';

const BotanicalVine = memo(({ className, style }) => (
  <svg viewBox="0 0 100 300" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <path d="M 50 0 C 20 50, 80 100, 50 150 C 20 200, 80 250, 50 300" strokeWidth="1.2" />
    <path d="M 38 32 C 15 28, 5 10, 20 5 C 30 10, 35 24, 38 32 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 62 82 C 85 86, 95 104, 80 109 C 70 104, 65 90, 62 82 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 38 182 C 15 178, 5 160, 20 155 C 30 160, 35 174, 38 182 Z" fill="#B89A5A" fillOpacity="0.05" />
    <path d="M 62 232 C 85 236, 95 254, 80 259 C 70 254, 65 240, 62 232 Z" fill="#B89A5A" fillOpacity="0.05" />
    <g transform="translate(75, 50)">
      <circle cx="0" cy="0" r="2" fill="#B89A5A" />
      <circle cx="0" cy="0" r="4" />
      <path d="M 0 -4 C -2 -7, 2 -7, 0 -4 M -4 0 C -7 -2, -7 2, -4 0 M 4 0 C 7 -2, 7 2, 4 0 M 0 4 C -2 7, 2 7, 0 4" />
    </g>
    <g transform="translate(25, 210)">
      <circle cx="0" cy="0" r="2" fill="#B89A5A" />
      <circle cx="0" cy="0" r="4" />
      <path d="M 0 -4 C -2 -7, 2 -7, 0 -4 M -4 0 C -7 -2, -7 2, -4 0 M 4 0 C 7 -2, 7 2, 4 0 M 0 4 C -2 7, 2 7, 0 4" />
    </g>
    <circle cx="50" cy="90" r="1" fill="#E8DDC7" />
    <circle cx="50" cy="190" r="1" fill="#B89A5A" />
  </svg>
));
BotanicalVine.displayName = 'BotanicalVine';

const Lotus = memo(({ className, style }) => (
  <svg viewBox="0 0 80 80" className={className} style={style} fill="none" stroke="#E8DDC7" strokeWidth="0.8" aria-hidden="true" role="presentation">
    <path d="M 40 15 C 40 15, 30 28, 30 45 C 30 62, 40 70, 40 70 C 40 70, 50 62, 50 45 C 50 28, 40 15, 40 15 Z" />
    <path d="M 40 32 C 35 34, 23 41, 23 51 C 23 61, 31 70, 40 70" />
    <path d="M 40 45 C 32 47, 16 54, 16 63 C 16 67, 22 70, 30 70" />
    <path d="M 40 32 C 45 34, 57 41, 57 51 C 57 61, 49 70, 40 70" />
    <path d="M 40 45 C 48 47, 64 54, 64 63 C 64 67, 58 70, 50 70" />
  </svg>
));
Lotus.displayName = 'Lotus';

const Sparkle = memo(({ className, style }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="#B89A5A" strokeWidth="1" aria-hidden="true" role="presentation">
    <path d="M 12 2 C 12 2, 13 9, 13 9 C 13 9, 20 12, 20 12 C 20 12, 13 12, 13 12 C 13 12, 12 20, 12 20 C 12 20, 11 12, 11 12 C 11 12, 4 12, 4 12 C 4 12, 11 9, 11 9 C 11 9, 12 2, 12 2 Z" fill="#B89A5A" fillOpacity="0.1" />
  </svg>
));
Sparkle.displayName = 'Sparkle';

const TinyDots = memo(({ className, style }) => (
  <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true" role="presentation">
    <circle cx="10" cy="15" r="1.5" fill="#E8DDC7" />
    <circle cx="20" cy="12" r="1" fill="#B89A5A" />
    <circle cx="30" cy="18" r="1.5" fill="#E8DDC7" />
    <circle cx="15" cy="28" r="1.2" fill="#B89A5A" />
    <circle cx="25" cy="25" r="1.5" fill="#E8DDC7" />
  </svg>
));
TinyDots.displayName = 'TinyDots';

const ICONS_MAP = {
  Feather: Feather,
  Flower: Flower,
  Sparkles: Sparkles,
  Crown: Crown,
  MessageSquare: MessageSquare,
  Mail: Mail
};

// Broken image fallback handler
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23FAF6F0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23B89A5A'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const Logo = ({ settings, className }) => {
  const [error, setError] = useState(false);
  const logoUrl = settings?.logo || "/images/logo.jpg";
  const logoText = settings?.logoText || "Stained Blooms";

  if (error || !logoUrl) {
    return (
      <span className="font-serif text-lg md:text-xl tracking-widest uppercase font-semibold text-[#B89A5A]">
        {logoText}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={logoText}
      className={className}
      onError={(e) => {
        console.error("Logo image failed to load:", e);
        setError(true);
      }}
    />
  );
};

const GalleryImageCard = memo(({ item, index, onClick, fallbackImage }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut', delay: Math.min(index * 0.02, 0.15) }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${item.title || item.category} image`}
      className="card-luxury p-2.5 relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A] focus:ring-offset-2"
    >
      <div className="aspect-square rounded-[16px] overflow-hidden relative bg-[#FAF6F0] shadow-inner">
        {/* Shimmer Skeleton Placeholder */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-[#FAF6F0] overflow-hidden rounded-[16px]">
            <div className="w-full h-full animate-shimmer" />
          </div>
        )}

        <img
          src={item.image}
          alt={item.title || `${item.category} mehendi design`}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setHasError(true);
            setIsLoaded(true);
            e.currentTarget.src = fallbackImage;
          }}
        />
        
        {isLoaded && !hasError && (
          <div className="absolute inset-0 bg-[#0E3B2E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-[16px]">
            <span className="text-[#FAF6F0] bg-[#0E3B2E]/90 px-4 py-2 rounded-full text-[9px] tracking-[0.15em] uppercase font-semibold">
              View Details
            </span>
          </div>
        )}
      </div>
      <div className="pt-3 px-1 text-left">
        <span className="text-[9px] tracking-[0.12em] uppercase text-[#B89A5A] font-semibold">{item.category}</span>
        <h3 className="text-serif text-sm font-normal text-[#4A3528] mt-0.5 leading-tight group-hover:text-[#0E3B2E] transition-colors">
          {item.title}
        </h3>
      </div>
    </motion.div>
  );
});
GalleryImageCard.displayName = 'GalleryImageCard';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cms, setCms] = useState({
    hero: {},
    services: [],
    gallery: [],
    categories: [],
    contact: {},
    settings: {}
  });

  const loadCmsData = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAllPublicData();
      if (data) {
        setCms({
          hero:       data.hero       || {},
          services:   data.services   || [],
          gallery:    data.gallery    || [],
          categories: data.categories || [],
          contact:    data.contact    || {},
          settings:   data.settings   || {},
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('[CMS] Failed to load data:', err);
      setError(err.message || 'Connection Error: Failed to connect to Supabase.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCmsData();
    const unsubscribe = subscribeCMSUpdates(loadCmsData);
    return unsubscribe;
  }, [loadCmsData]);

  useEffect(() => {
    if (cms.settings) {
      if (cms.settings.metaTitle) {
        document.title = cms.settings.metaTitle;
      }
      if (cms.settings.metaDescription) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', cms.settings.metaDescription);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = cms.settings.metaDescription;
          document.head.appendChild(meta);
        }
      }
      if (cms.settings.favicon) {
        const link = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = cms.settings.favicon;
        } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = cms.settings.favicon;
          document.head.appendChild(newLink);
        }
      }
    }
  }, [cms.settings]);

  // Lightbox State — declared BEFORE any conditional returns
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Monitor scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Idle Preload all gallery images in background for instant switching
  useEffect(() => {
    if (!loading && cms.gallery && cms.gallery.length > 0) {
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
      idleCallback(() => {
        cms.gallery.forEach((item) => {
          if (item.image) {
            const img = new Image();
            img.src = item.image;
          }
        });
      });
    }
  }, [loading, cms.gallery]);

  // Filter gallery items (Memoized to prevent recalculations)
  const filteredGallery = useMemo(() => {
    return activeCategory === 'All'
      ? (cms.gallery || [])
      : (cms.gallery || []).filter(item => item.category === activeCategory);
  }, [activeCategory, cms.gallery]);

  // Lightbox Navigation
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredGallery.length);
  }, [filteredGallery.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
  }, [filteredGallery.length]);

  // Keyboard navigation for Lightbox — also traps focus inside
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  // Build WhatsApp URL from CMS number
  const whatsappUrl = cms.contact?.whatsappNumber
    ? (cms.contact.whatsappNumber.startsWith('http')
      ? cms.contact.whatsappNumber
      : `https://wa.me/${cms.contact.whatsappNumber.replace(/[^0-9]/g, '')}`)
    : '#';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0]">
        <div className="w-12 h-12 border-2 border-[#E7DCCF] border-t-[#B89A5A] rounded-full animate-spin" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6F0] p-6 text-center text-sans">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-serif text-3xl font-light text-[#4A3528] mb-3">Connection Unavailable</h2>
        <p className="text-sm font-light text-[#6B6258] max-w-md mb-8 leading-relaxed">
          {error}
        </p>
        <button
          onClick={loadCmsData}
          className="btn-primary px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#6B6258] text-sans relative selection:bg-[#B89A5A]/20 selection:text-[#0E3B2E] overflow-x-hidden">

      {/* SEAMLESS CONTINUOUS MEHENDI BACKGROUND CANVAS */}
      <MehendiBackground />


      {/* HEADER / NAVIGATION */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF6F0]/92 backdrop-blur-md border-b border-[#E7DCCF] py-3.5 shadow-sm'
          : 'bg-[#FAF6F0]/70 backdrop-blur-[6px] border-b border-[#E7DCCF]/40 py-[18px]'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <a href="#home" className="flex items-center group">
            <Logo
              settings={cms.settings}
              className="h-10 md:h-12 w-auto object-contain rounded-md transition-opacity duration-300 group-hover:opacity-85"
            />
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10" aria-label="Main navigation">
            {['Home', 'Gallery', 'Services', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs tracking-[0.12em] uppercase text-[#4A3528] hover:text-[#0E3B2E] transition-colors duration-200 relative py-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#B89A5A] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href={cms.contact.instagramUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary gap-2 px-5 py-2.5"
              aria-label="Book Now on Instagram"
            >
              <Instagram className="w-4 h-4 text-[#B89A5A]" />
              <span>Book Now</span>
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#4A3528] focus:outline-none focus:ring-2 focus:ring-[#B89A5A] rounded-md"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#FAF6F0] border-b border-[#E7DCCF] absolute top-full left-0 right-0 shadow-lg overflow-hidden"
            >
              <nav className="px-6 py-8 flex flex-col space-y-6" aria-label="Mobile navigation">
                {['Home', 'Gallery', 'Services', 'Contact'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm tracking-[0.12em] uppercase font-semibold text-[#4A3528] hover:text-[#0E3B2E] transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <a
                  href={cms.contact.instagramUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary gap-2 w-full py-4"
                  aria-label="Book Now on Instagram"
                >
                  <Instagram className="w-5 h-5 text-[#B89A5A]" />
                  <span>Book Now</span>
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="pt-32 pb-20 md:pt-48 md:pb-28 relative z-10 bg-transparent">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="md:col-span-7 flex flex-col items-start text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FAF6F0] border border-[#E7DCCF] rounded-full text-[10px] text-[#0E3B2E] uppercase tracking-[0.2em] mb-6 font-semibold">
                <Sparkles className="w-3 h-3 text-[#B89A5A]" aria-hidden="true" />
                <span>Timeless Designs.</span>
              </div>

              <h1 className="text-serif text-5xl sm:text-6xl lg:text-[76px] font-light text-[#4A3528] leading-[1.05] mb-6 whitespace-pre-line">
                {cms.hero.heading}
              </h1>

              {/* Elegant divider */}
              <div className="flex items-center gap-3 w-40 my-3" aria-hidden="true">
                <div className="h-[1px] bg-[#E7DCCF] flex-1"></div>
                <div className="w-2 h-2 rounded-full border border-[#B89A5A] bg-transparent"></div>
                <div className="h-[1px] bg-[#E7DCCF] flex-1"></div>
              </div>

              <p className="text-sans text-sm md:text-[15px] text-[#6B6258] leading-relaxed max-w-lg mb-8 tracking-wide font-light">
                {cms.hero.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <a
                  href={cms.hero.buttonUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary gap-2 px-8 py-4 w-full sm:w-auto"
                  aria-label={cms.hero.buttonText || 'Message on Instagram'}
                >
                  <Instagram className="w-4 h-4 text-[#B89A5A]" />
                  <span>{cms.hero.buttonText}</span>
                </a>
                <a
                  href={cms.hero.secondaryButtonUrl || '#gallery'}
                  className="btn-outline gap-2 px-8 py-4 w-full sm:w-auto"
                >
                  <span>{cms.hero.secondaryButtonText}</span>
                  <span className="text-sm font-normal" aria-hidden="true">→</span>
                </a>
              </div>
            </motion.div>

            {/* Right Column (Bridal Image) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:col-span-5 w-full flex justify-center"
            >
              <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[20px] overflow-hidden border-4 border-[#E7DCCF] shadow-[0_8px_40px_rgba(74,53,40,0.08)] group">
                <img
                  src={cms.hero.image}
                  alt="Premium bridal mehendi details"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="eager"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-24 bg-transparent border-t border-[#E7DCCF] relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#B89A5A] font-semibold" aria-hidden="true">✦ Delicate Artistry ✦</span>
            <h2 className="text-serif text-4xl md:text-5xl font-light text-[#4A3528] mt-2 mb-4">
              Gallery
            </h2>
            <div className="separator-gold text-[#B89A5A] w-48 mx-auto" aria-hidden="true"></div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-12 max-w-3xl mx-auto" role="group" aria-label="Gallery filter categories">
            {cms.categories.filter(c => c.isVisible).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                aria-pressed={activeCategory === cat.name}
                className={`px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 ${
                  activeCategory === cat.name
                    ? 'bg-[#0E3B2E] text-[#FAF6F0] shadow-luxury'
                    : 'bg-[#FAF6F0]/70 text-[#4A3528] border border-[#E7DCCF] hover:bg-[#FAF6F0]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            <AnimatePresence mode="popLayout">
              {filteredGallery.length > 0 ? filteredGallery.map((item, index) => (
                <GalleryImageCard
                  key={item.id}
                  item={item}
                  index={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setLightboxOpen(true);
                  }}
                  fallbackImage={FALLBACK_IMAGE}
                />
              )) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-2 md:col-span-4 py-20 flex flex-col items-center justify-center text-center"
                >
                  <Flower className="w-10 h-10 text-[#E7DCCF] mb-4 stroke-[1]" aria-hidden="true" />
                  <p className="text-sm text-[#6B6258]/60 font-light">No images in this category yet.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bottom CTA */}
          <div className="text-center">
            <a
              href={cms.contact?.instagramUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline gap-2 px-8 py-3.5"
              aria-label="View full gallery on Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-[#B89A5A]" />
              <span>View Full Gallery</span>
            </a>
          </div>

        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="pt-16 pb-24 bg-transparent border-t border-[#E7DCCF] relative z-10 overflow-hidden">
        {/* Soft background botanical artwork */}
        <div className="absolute top-10 -left-20 w-80 h-80 opacity-[0.03] pointer-events-none select-none" aria-hidden="true">
          <LargeMandala className="w-full h-full" />
        </div>
        <div className="absolute bottom-10 -right-20 w-80 h-80 opacity-[0.03] pointer-events-none select-none" aria-hidden="true">
          <BotanicalVine className="w-full h-full" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B89A5A] font-semibold" aria-hidden="true">✦ Tailored Experiences ✦</span>
            <h2 className="text-serif text-4xl md:text-5xl font-light text-[#4A3528] mt-2 mb-3">
              Our Services
            </h2>
            <div className="flex items-center justify-center gap-3 w-48 mx-auto" aria-hidden="true">
              <div className="h-[1px] bg-[#B89A5A]/40 flex-1"></div>
              <Sparkles className="w-3.5 h-3.5 text-[#B89A5A]" aria-hidden="true" />
              <div className="h-[1px] bg-[#B89A5A]/40 flex-1"></div>
            </div>
            <p className="text-xs text-[#6B6258] mt-4 font-light tracking-wide">Delivering luxury bespoke mehendi artistry for your special day.</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {cms.services.map((service, idx) => {
              const isFeatured = service.isFeatured;
              const IconComponent = ICONS_MAP[service.icon] || Sparkles;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  key={service.id || service.name}
                  className={`group p-9 flex flex-col justify-between items-center text-center transition-all duration-300 min-h-[400px] ${
                    isFeatured
                      ? 'bg-gradient-to-b from-[#0E3B2E] to-[#0A3025] border border-[#B89A5A]/40 rounded-[24px] ring-2 ring-[#B89A5A]/10 shadow-[0_20px_50px_rgba(14,59,46,0.22)] hover:shadow-[0_24px_60px_rgba(14,59,46,0.32)] hover:-translate-y-2'
                      : 'bg-[#FAF6F0]/90 backdrop-blur-[4px] border border-[#E8DDC7] rounded-[24px] shadow-[0_12px_40px_rgba(74,53,40,0.03)] hover:shadow-[0_16px_48px_rgba(74,53,40,0.07)] hover:-translate-y-1'
                  }`}
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Icon container */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-8 border transition-all duration-300 ${
                      isFeatured
                        ? 'bg-[#0A3025] border-[#B89A5A]/40 ring-2 ring-[#B89A5A]/10'
                        : 'bg-[#FAF6F0] border-[#E7DCCF] group-hover:border-[#B89A5A]/40'
                    }`}>
                      <IconComponent className="w-6 h-6 text-[#B89A5A]" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h3 className={`text-serif text-3xl font-light mb-2 tracking-wide transition-colors ${
                      isFeatured ? 'text-[#FAF6F0]' : 'text-[#4A3528] group-hover:text-[#0E3B2E]'
                    }`}>{service.name}</h3>

                    {/* Decorative divider */}
                    <div className={`w-12 h-[1px] mb-6 transition-all duration-300 ${
                      isFeatured ? 'bg-[#B89A5A]/40' : 'bg-[#E8DDC7] group-hover:bg-[#B89A5A]/50'
                    }`} aria-hidden="true"></div>

                    {/* Main details text */}
                    <p className={`text-xs leading-relaxed font-light ${
                      isFeatured ? 'text-[#E8DDC7]/80' : 'text-[#6B6258]'
                    }`}>{service.details}</p>
                  </div>

                  {/* Bottom section */}
                  <div className="mt-8 w-full flex flex-col items-center">
                    <a
                      href={cms.contact.instagramUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Book ${service.name} via Instagram`}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-full text-[10px] uppercase tracking-[0.15em] font-semibold transition-all duration-300 ${
                        isFeatured
                          ? 'bg-[#B89A5A] text-[#0E3B2E] hover:bg-[#A38546] hover:-translate-y-0.5 hover:shadow-luxury-hover'
                          : 'btn-outline'
                      }`}
                    >
                      <span>Book Service</span>
                      <span className="font-normal" aria-hidden="true">→</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Custom CTA */}
          <div className="text-center mt-16">
            <a
              href={cms.contact.instagramUrl || 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary gap-2 px-8 py-4"
              aria-label="Inquire for Custom Designs on Instagram"
            >
              <Instagram className="w-4 h-4 text-[#B89A5A]" />
              <span>Inquire for Custom Designs</span>
            </a>
          </div>

        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-[72px] md:py-[120px] bg-transparent border-t border-[#E7DCCF] relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16 flex flex-col items-center">
            <Flower className="w-8 h-8 text-[#B89A5A] mb-4 stroke-[1.25]" aria-hidden="true" />

            <h2 className="text-serif text-[28px] sm:text-[40px] md:text-[56px] font-light text-[#4A3528] leading-none mb-3">
              Let's Connect
            </h2>

            <div className="flex items-center gap-3 w-40 my-3" aria-hidden="true">
              <div className="h-[1px] bg-[#E7DCCF] flex-1"></div>
              <Sparkles className="w-3 h-3 text-[#B89A5A]" aria-hidden="true" />
              <div className="h-[1px] bg-[#E7DCCF] flex-1"></div>
            </div>

            <p className="text-sans text-sm md:text-[15px] text-[#6B6258] leading-relaxed mt-2 tracking-wide font-light">
              Have questions or ready to book your special day?<br />
              Choose your preferred way to connect with me.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full mb-8 md:mb-16">

            {/* Instagram Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card-luxury p-5 md:p-9 flex flex-col justify-between items-center text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mb-3 md:mb-6 border border-[#E7DCCF] group-hover:scale-110 group-hover:rotate-[4deg] transition-all duration-300">
                  <Instagram className="w-5 h-5 md:w-7 md:h-7 text-[#B89A5A] stroke-[1.25]" />
                </div>
                <h3 className="text-serif text-xl md:text-2xl font-light text-[#4A3528] mb-2">Instagram</h3>
                <p className="text-sans text-xs text-[#6B6258] leading-relaxed mb-4 md:mb-8 max-w-[200px] font-light">
                  See my latest bridal work and send me a direct message.
                </p>
              </div>
              <a
                href={cms.contact.instagramUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary gap-2 w-full py-3 text-[10px] tracking-[0.15em]"
                aria-label="Message on Instagram"
              >
                <span>Message on Instagram</span>
                <span className="text-sm font-normal" aria-hidden="true">→</span>
              </a>
            </motion.div>

            {/* WhatsApp Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card-luxury p-5 md:p-9 flex flex-col justify-between items-center text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mb-3 md:mb-6 border border-[#E7DCCF] group-hover:scale-110 group-hover:rotate-[4deg] transition-all duration-300">
                  <WhatsApp className="w-5 h-5 md:w-7 md:h-7 text-[#B89A5A] stroke-[1.25]" />
                </div>
                <h3 className="text-serif text-xl md:text-2xl font-light text-[#4A3528] mb-2">WhatsApp</h3>
                <p className="text-sans text-xs text-[#6B6258] leading-relaxed mb-4 md:mb-8 max-w-[200px] font-light">
                  Quick responses for bookings and enquiries.
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary gap-2 w-full py-3 text-[10px] tracking-[0.15em]"
                aria-label="Chat on WhatsApp"
              >
                <span>Chat on WhatsApp</span>
                <span className="text-sm font-normal" aria-hidden="true">→</span>
              </a>
            </motion.div>

            {/* Email Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card-luxury p-5 md:p-9 flex flex-col justify-between items-center text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mb-3 md:mb-6 border border-[#E7DCCF] group-hover:scale-110 group-hover:rotate-[4deg] transition-all duration-300">
                  <Mail className="w-5 h-5 md:w-7 md:h-7 text-[#B89A5A] stroke-[1.25]" aria-hidden="true" />
                </div>
                <h3 className="text-serif text-xl md:text-2xl font-light text-[#4A3528] mb-2">Email</h3>
                <p className="text-sans text-xs text-[#6B6258] leading-relaxed mb-4 md:mb-8 max-w-[200px] font-light">
                  Perfect for collaborations and detailed enquiries.
                </p>
              </div>
              <a
                href={`mailto:${cms.contact.emailAddress || ''}`}
                className="btn-primary gap-2 w-full py-3 text-[10px] tracking-[0.15em]"
                aria-label={`Send email to ${cms.contact.emailAddress || 'us'}`}
              >
                <span>Send an Email</span>
                <span className="text-sm font-normal" aria-hidden="true">→</span>
              </a>
            </motion.div>

          </div>

          {/* Bottom CTA Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full bg-[#FAF6F0] border border-[#E7DCCF] rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-luxury"
          >
            {/* Faint lacy mandala */}
            <div className="absolute -bottom-24 -right-24 w-60 h-60 opacity-[0.05] pointer-events-none select-none" aria-hidden="true">
              <MandalaCornerSVG className="w-full h-full rotate-90" />
            </div>

            {/* Left illustrated mehendi cone */}
            <div className="flex items-center gap-6 md:gap-8 z-10 w-full md:w-auto">
              <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-[24px] overflow-hidden border border-[#E7DCCF] shadow-sm hidden sm:block bg-white">
                <img
                  src="/images/cones.jpg"
                  alt="Mehendi cones"
                  className="w-full h-full object-cover rotate-45 scale-110"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                />
              </div>

              {/* Center Text */}
              <div className="text-left">
                <h4 className="text-serif text-2xl md:text-3xl font-light text-[#4A3528] mb-1">
                  Let's create something beautiful together.
                </h4>
                <p className="text-sans text-[10px] md:text-xs text-[#B89A5A] uppercase tracking-[0.15em] font-bold">
                  Bridal bookings • Festivals • Custom Designs
                </p>
              </div>
            </div>

            {/* Right CTA Button */}
            <div className="mt-6 md:mt-0 z-10 w-full md:w-auto text-right shrink-0">
              <a
                href={cms.contact.instagramUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary gap-2 px-8 py-4 w-full md:w-auto"
                aria-label={cms.contact.ctaText || 'DM on Instagram'}
              >
                <Instagram className="w-4 h-4 text-[#B89A5A]" />
                <span>{cms.contact.ctaText || 'DM on Instagram'}</span>
              </a>
            </div>
          </motion.div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#0E3B2E] overflow-hidden">
        {/* Decorative mandalas */}
        <div className="absolute -top-16 -right-16 w-64 h-64 opacity-[0.07] pointer-events-none select-none" aria-hidden="true">
          <LargeMandala className="w-full h-full" />
        </div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 opacity-[0.06] pointer-events-none select-none" aria-hidden="true">
          <SmallMandala className="w-full h-full" />
        </div>

        {/* Top Section */}
        <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">

            {/* Brand Column */}
            <div className="md:col-span-1 flex flex-col items-start">
              <a href="#home" className="mb-4 flex items-center gap-3 group">
                <Logo
                  settings={cms.settings}
                  className="h-12 md:h-16 w-auto object-contain rounded-md opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="flex flex-col text-left leading-tight text-[#E8DDC7]">
                  <span className="text-serif text-lg tracking-wider font-semibold group-hover:text-[#B89A5A] transition-colors">
                    {cms.settings.logoText || "Stained Blooms"}
                  </span>
                  <span className="text-[9px] tracking-widest uppercase text-[#B89A5A] font-light">
                    by Anshidha Saleem
                  </span>
                </div>
              </a>
              <p className="text-sans text-xs text-[#E8DDC7]/70 leading-relaxed font-light max-w-[200px]">
                Creating timeless mehendi art that celebrates your beautiful moments.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-4 mt-6">
                <a
                  href={cms.contact.instagramUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#B89A5A]/30 flex items-center justify-center text-[#B89A5A] hover:border-[#B89A5A] hover:text-[#E8DDC7] transition-all duration-300"
                  aria-label="Follow on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#B89A5A]/30 flex items-center justify-center text-[#B89A5A] hover:border-[#B89A5A] hover:text-[#E8DDC7] transition-all duration-300"
                  aria-label="Chat on WhatsApp"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href={`mailto:${cms.contact.emailAddress || ''}`}
                  className="w-9 h-9 rounded-full border border-[#B89A5A]/30 flex items-center justify-center text-[#B89A5A] hover:border-[#B89A5A] hover:text-[#E8DDC7] transition-all duration-300"
                  aria-label={`Email ${cms.contact.emailAddress || 'us'}`}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col">
              <h5 className="text-sans text-[10px] tracking-[0.25em] uppercase font-semibold text-[#B89A5A] mb-5">Quick Links</h5>
              <ul className="space-y-3">
                {['Home', 'Gallery', 'Services', 'Contact'].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase()}`}
                      className="text-xs text-[#E8DDC7]/70 hover:text-[#E8DDC7] transition-colors font-light tracking-wide"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="flex flex-col">
              <h5 className="text-sans text-[10px] tracking-[0.25em] uppercase font-semibold text-[#B89A5A] mb-5">Services</h5>
              <ul className="space-y-3">
                {cms.services.map((svc) => (
                  <li key={svc.id || svc.name}>
                    <span className="text-xs text-[#E8DDC7]/70 font-light tracking-wide">{svc.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Me */}
            <div className="flex flex-col">
              <h5 className="text-sans text-[10px] tracking-[0.25em] uppercase font-semibold text-[#B89A5A] mb-5">Follow Me</h5>
              <div className="space-y-4">
                <a
                  href={cms.contact.instagramUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#E8DDC7]/70 hover:text-[#E8DDC7] transition-colors group"
                  aria-label="Follow on Instagram"
                >
                  <Instagram className="w-4 h-4 text-[#B89A5A] shrink-0" />
                  <span className="text-xs font-light tracking-wide">@stained.blooms</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#E8DDC7]/70 hover:text-[#E8DDC7] transition-colors group"
                  aria-label="Chat on WhatsApp"
                >
                  <Send className="w-4 h-4 text-[#B89A5A] shrink-0" aria-hidden="true" />
                  <span className="text-xs font-light tracking-wide">Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Thin gold divider */}
        <div className="border-t border-[#B89A5A]/20 mx-6" aria-hidden="true"></div>

        {/* Bottom bar */}
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[10px] tracking-[0.15em] text-[#E8DDC7]/50 uppercase font-light">
            {cms.settings.footerText}
          </p>
          <p className="text-[10px] tracking-[0.12em] text-[#B89A5A]/60 uppercase font-light">
            Luxury Bridal Mehendi
          </p>
        </div>
      </footer>

      {/* LIGHTBOX GALLERY MODAL */}
      <AnimatePresence>
        {lightboxOpen && filteredGallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0A3025]/95 flex items-center justify-center p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery image ${currentImageIndex + 1} of ${filteredGallery.length}: ${filteredGallery[currentImageIndex]?.title || filteredGallery[currentImageIndex]?.category}`}
            onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/20 text-[#FAF6F0] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A]"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-2 sm:left-6 p-3 rounded-full bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/20 text-[#FAF6F0] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A] z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <motion.div
              key={currentImageIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl w-full mx-10 sm:mx-16 flex flex-col md:flex-row bg-[#FAF6F0] rounded-[24px] overflow-hidden shadow-luxury"
            >
              <div className="flex-1 aspect-square md:aspect-auto md:h-[500px] bg-black relative">
                <img
                  src={filteredGallery[currentImageIndex].image}
                  alt={filteredGallery[currentImageIndex].title || `${filteredGallery[currentImageIndex].category} mehendi design`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                />
              </div>

              <div className="w-full md:w-[320px] p-8 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] tracking-widest uppercase text-[#B89A5A] font-semibold block mb-1">
                    {filteredGallery[currentImageIndex].category}
                  </span>

                  <h3 className="text-serif text-3xl font-light text-[#4A3528] mb-4">
                    {filteredGallery[currentImageIndex].title}
                  </h3>

                  <div className="w-10 h-[1px] bg-[#B89A5A] mb-4" aria-hidden="true"></div>

                  <p className="text-xs text-[#6B6258] leading-relaxed font-light">
                    {filteredGallery[currentImageIndex].description}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E7DCCF] flex flex-col gap-3">
                  <a
                    href={cms.contact.instagramUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary gap-2 w-full py-3 text-[10px] tracking-[0.15em]"
                    aria-label="Inquire about this design via Instagram"
                  >
                    <Instagram className="w-4 h-4 text-[#B89A5A]" />
                    <span>Inquire via Instagram</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline gap-2 w-full py-3 text-[10px] tracking-[0.15em]"
                    aria-label="Inquire about this design via WhatsApp"
                  >
                    <Send className="w-4 h-4 text-[#B89A5A]" aria-hidden="true" />
                    <span>Inquire via WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>

            <button
              onClick={nextImage}
              className="absolute right-2 sm:right-6 p-3 rounded-full bg-[#FAF6F0]/10 hover:bg-[#FAF6F0]/20 text-[#FAF6F0] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B89A5A] z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
