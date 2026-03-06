"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface Company {
  id: string;
  name: string;
  logo: string;
}

const COMPANIES: Company[] = [
  { id: "every", name: "Every", logo: "/logos/every.svg" },
  { id: "base-power", name: "Base Power", logo: "/logos/base-power.svg" },
  { id: "cursor", name: "Cursor", logo: "/logos/cursor.png" },
  { id: "raycast", name: "Raycast", logo: "/logos/raycast.png" },
  { id: "macro", name: "Macro", logo: "/logos/macro.svg" },
  { id: "midjourney", name: "Midjourney", logo: "/logos/midjourney.png" },
  { id: "sandbar", name: "Sandbar", logo: "/logos/sandbar.svg" },
  { id: "infinite-machine", name: "Infinite Machine", logo: "/logos/infinite-machine.svg" },
  { id: "opal", name: "Opal", logo: "/logos/opal.svg" },
  { id: "substack", name: "Substack", logo: "/logos/substack.svg" },
  { id: "physical-intelligence", name: "Physical Intelligence", logo: "/logos/physical-intelligence.svg" },
  { id: "cosmos", name: "Cosmos", logo: "/logos/cosmos.svg" },
  { id: "avec", name: "Avec", logo: "/logos/avec.svg" },
  { id: "thru", name: "Thru", logo: "/logos/thru.svg" },
];

export default function Home() {
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [averages, setAverages] = useState<Record<string, { averageX: number; count: number }> | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const allPlaced = Object.keys(positions).length === COMPANIES.length;

  const getXFromEvent = useCallback((clientX: number) => {
    if (!graphRef.current) return 0.5;
    const rect = graphRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, x));
  }, []);

  const handlePointerDown = useCallback((companyId: string, e: React.PointerEvent) => {
    if (submitted) return;
    e.preventDefault();
    setDragging(companyId);
    const x = getXFromEvent(e.clientX);
    setPositions((prev) => ({ ...prev, [companyId]: x }));
  }, [submitted, getXFromEvent]);


  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || submitted) return;
      const x = getXFromEvent(e.clientX);
      setPositions((prev) => ({ ...prev, [dragging]: x }));
    };
    const onUp = () => setDragging(null);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dragging, submitted, getXFromEvent]);

  const handleSubmit = async () => {
    if (!allPlaced) return;
    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes: positions }),
      });
      const res = await fetch("/api/votes");
      const data = await res.json();
      setAverages(data);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  const placedCompanies = COMPANIES.filter((c) => c.id in positions);
  const unplacedCompanies = COMPANIES.filter((c) => !(c.id in positions));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-black/10">
        <h1 className="text-xs font-bold tracking-[0.3em] uppercase">
          Afterimage
        </h1>
      </header>

      <div className="flex-1 flex flex-col px-6 py-8 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-2">
            The Spectrum
          </h2>
          <p className="text-sm text-black/50">
            {submitted
              ? "Average placements from all voters"
              : allPlaced
                ? "All placed. Submit your votes."
                : "Drag each company onto the spectrum."}
          </p>
        </div>

        {/* Graph Area */}
        <div
          ref={graphRef}
          className="relative border border-black/15 rounded-lg bg-neutral-50 flex-1 min-h-[400px] select-none touch-none"
        >
          {/* Axis labels */}
          <div className="absolute top-0 left-0 bottom-0 w-24 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="text-5xl mb-2">🐚</div>
            <span className="text-xl font-bold tracking-[0.15em]">PUKA</span>
          </div>
          <div className="absolute top-0 right-0 bottom-0 w-24 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="text-5xl mb-2">🤵</div>
            <span className="text-xl font-bold tracking-[0.15em]">CHIC</span>
          </div>

          {/* Center line */}
          <div className="absolute top-4 bottom-4 left-1/2 w-px bg-black/10" />

          {/* Gradient bar */}
          <div className="absolute bottom-6 left-28 right-28 h-1 rounded-full bg-gradient-to-r from-amber-300 via-neutral-300 to-neutral-800" />

          {/* Placed logos on the graph */}
          {(submitted && averages ? COMPANIES : placedCompanies).map((company, i) => {
            const x = submitted && averages && averages[company.id]
              ? averages[company.id].averageX
              : positions[company.id];
            if (x === undefined) return null;

            const leftPercent = 12 + x * 76; // 12% to 88% range to avoid overlap with labels
            const row = i % 5;
            const topPercent = 15 + row * 15;

            return (
              <div
                key={company.id}
                className={`absolute flex flex-col items-center transition-all duration-300 ${
                  dragging === company.id ? "z-30 scale-110" : "z-20"
                } ${submitted ? "" : "cursor-grab active:cursor-grabbing"}`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onPointerDown={(e) => handlePointerDown(company.id, e)}
              >
                <div className="w-12 h-12 bg-white rounded-lg shadow-md border border-black/10 flex items-center justify-center overflow-hidden p-1.5">
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={40}
                    height={40}
                    className="object-contain pointer-events-none"
                    draggable={false}
                  />
                </div>
                <span className="text-[10px] font-bold mt-1 whitespace-nowrap">
                  {company.name}
                  {submitted && averages && averages[company.id] && (
                    <span className="font-normal text-black/40 ml-1">
                      ({averages[company.id].count})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Unplaced logos tray */}
        {!submitted && unplacedCompanies.length > 0 && (
          <div className="mt-6 border border-black/10 rounded-lg p-4">
            <p className="text-xs text-black/40 font-bold uppercase tracking-wider mb-3">
              Drag to place ({unplacedCompanies.length} remaining)
            </p>
            <div className="flex flex-wrap gap-3">
              {unplacedCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex flex-col items-center cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handlePointerDown(company.id, e)}
                >
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-black/10 flex items-center justify-center overflow-hidden p-1.5 hover:shadow-md transition-shadow">
                    <Image
                      src={company.logo}
                      alt={company.name}
                      width={40}
                      height={40}
                      className="object-contain pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  <span className="text-[10px] font-bold mt-1">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        {!submitted && allPlaced && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-black text-white text-sm font-bold tracking-wider uppercase rounded-full hover:bg-black/80 transition-colors"
            >
              Submit & See Results
            </button>
          </div>
        )}
      </div>

      {/* Explainer Section */}
      <section className="border-t border-black/10 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-center mb-2">
            Wondering what is PUKA and what is CHIC?
          </h3>
          <div className="mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* PUKA side */}
            <div>
              <h4 className="text-lg font-bold tracking-[0.15em] uppercase mb-4">
                PUKA
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/images/puka1.jpg"
                    alt="Puka shells on the beach"
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/images/puka2.jpg"
                    alt="Tropical beach with palm trees"
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden col-span-2">
                  <Image
                    src="/images/puka3.jpg"
                    alt="Colorful tie-dye textiles"
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden col-span-2">
                  <Image
                    src="/images/puka4.png"
                    alt="Surfer with board"
                    width={1200}
                    height={1600}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* CHIC side */}
            <div>
              <h4 className="text-lg font-bold tracking-[0.15em] uppercase mb-4">
                CHIC
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/images/chic1.png"
                    alt="Prada runway look"
                    width={600}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/images/chic2.png"
                    alt="Balenciaga architectural silhouette"
                    width={600}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden col-span-2">
                  <Image
                    src="/images/chic3.png"
                    alt="Fashion editorial"
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="rounded-lg overflow-hidden col-span-2">
                  <Image
                    src="/images/chic4.png"
                    alt="Black tie evening"
                    width={1200}
                    height={1200}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-black/10 text-center">
        <span className="text-xs text-black/30">
          Afterimage Projects LLC
        </span>
      </footer>
    </div>
  );
}
