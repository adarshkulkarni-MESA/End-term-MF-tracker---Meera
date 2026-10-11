'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

const NAV_LINKS = ['Home', 'Funds', 'Insights', 'Reports'];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const FADE_UP = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.6, delay, ease: EASE },
});

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 shrink-0"
        style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span style={{ color: 'hsl(var(--foreground))' }}>✦</span>
          <span style={{ color: 'hsl(var(--foreground))' }}>Meera&apos;s Tracker</span>
        </div>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <a
              key={link}
              href="#"
              className="text-sm transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: 'hsl(var(--primary))',
            color:      'hsl(var(--primary-foreground))',
            fontFamily: 'var(--font-inter, Inter, sans-serif)',
          }}
        >
          Launch Dashboard
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-start pt-10 overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Light overlay so text stays readable */}
        <div className="absolute inset-0 z-0" style={{ background: 'rgba(255,255,255,0.55)' }} />

        {/* All hero content — sits above video */}
        <div className="relative z-10 flex flex-col items-center w-full px-4">
          {/* Badge */}
          <motion.div {...{ ...FADE_UP(0), initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } }} className="mb-6">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
              style={{
                border:     '1px solid hsl(var(--border-color))',
                background: 'hsl(var(--background))',
                color:      'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-inter, Inter, sans-serif)',
              }}
            >
              Now with AI-powered insights ✨
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...FADE_UP(0.1)}
            className="text-center text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight max-w-xl"
            style={{
              fontFamily: 'var(--font-instrument-serif, "Instrument Serif", serif)',
              color:       'hsl(var(--foreground))',
            }}
          >
            The Future of{' '}
            <em
              className="not-italic"
              style={{
                fontFamily: 'var(--font-instrument-serif, "Instrument Serif", serif)',
                fontStyle:  'italic',
              }}
            >
              Smarter
            </em>{' '}
            Investing
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...FADE_UP(0.2)}
            className="mt-4 text-center text-base md:text-lg max-w-[650px] leading-relaxed"
            style={{
              color:      'hsl(var(--muted-foreground))',
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
            }}
          >
            Track your mutual fund portfolio with intelligent insights that monitor, analyze,
            and report—so you always know exactly where your investments stand.
          </motion.p>

          {/* CTA buttons */}
          <motion.div {...FADE_UP(0.3)} className="mt-5 flex items-center gap-3">
            {/* Primary */}
            <button
              onClick={onEnter}
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: 'hsl(var(--primary))',
                color:      'hsl(var(--primary-foreground))',
                fontFamily: 'var(--font-inter, Inter, sans-serif)',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
              }}
            >
              Launch Dashboard
            </button>

            {/* Play button */}
            <button
              className="h-11 w-11 rounded-full flex items-center justify-center transition-colors"
              style={{
                background:  'hsl(var(--background))',
                boxShadow:   '0 2px 12px rgba(0,0,0,0.08)',
                border:      'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--background))')}
            >
              <Play className="h-4 w-4" style={{ fill: 'hsl(var(--foreground))', color: 'hsl(var(--foreground))' }} />
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="mt-8 w-full max-w-5xl"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
