"use client";

import { useEffect, useState } from "react";
import { Fraunces, Instrument_Sans } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});
const sans = Instrument_Sans({ subsets: ["latin"] });

const greetings = [
  "Hola, mundo.",
  "Bonjour, le monde.",
  "Ciao, mondo.",
  "Hallo, Welt.",
  "Olá, mundo.",
  "Hej, världen.",
  "Merhaba, dünya.",
];

const lines = ["Hello,", "world."];

const css = `
  ::selection { background: #FFF1B8; color: #1B2FD6; }
  .letter {
    opacity: 0;
    transform: translateY(0.4em) rotate(6deg);
    animation: rise 1000ms cubic-bezier(.2,.8,.2,1) forwards;
  }
  @keyframes rise { to { opacity: 1; transform: none; } }
  .swap { animation: swap 700ms cubic-bezier(.2,.8,.2,1); }
  @keyframes swap {
    from { opacity: 0; transform: translateY(0.5em); }
    to { opacity: 1; transform: none; }
  }
  .grain {
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    opacity: .22;
    mix-blend-mode: overlay;
  }
  @media (prefers-reduced-motion: reduce) {
    .letter, .swap { animation: none; opacity: 1; transform: none; }
  }
`;

export default function Home() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % greetings.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <main
      className={`${sans.className} relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#1B2FD6] px-6 py-8 text-[#FFF1B8] sm:px-12 sm:py-12`}
    >
      <style>{css}</style>
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />

      <header className="relative text-sm text-[#B9C6FF] sm:text-base">Maya Jhamb</header>

      <section className="relative">
        <h1
          aria-label="Hello, world."
          className={`${display.className} text-[clamp(4.5rem,19vw,17rem)] font-bold leading-[0.82] tracking-[-0.045em]`}
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
        >
          {lines.map((line, li) => (
            <span key={line} aria-hidden className="block">
              {line.split("").map((ch, ci) => (
                <span
                  key={`${li}-${ci}`}
                  className="letter inline-block"
                  style={{ animationDelay: `${(li * 6 + ci) * 60}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p
          aria-hidden
          className={`${display.className} mt-6 h-[1.3em] text-[clamp(1.5rem,4vw,2.75rem)] italic text-[#B9C6FF]`}
        >
          <span key={i} className="swap inline-block">
            {greetings[i]}
          </span>
        </p>
      </section>

      <footer className="relative max-w-sm text-sm leading-relaxed text-[#B9C6FF] sm:text-base">
        My first page, built with Next.js and deployed on Vercel.
      </footer>
    </main>
  );
}
