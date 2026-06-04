"use client";

import { useState } from "react";
import Image from "next/image";

type VehicleCard = {
  src: string;
  title: string;
  desc: string;
  plateBlur?: boolean;
};

export function VehicleCarousel({ vehicles }: { vehicles: VehicleCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((current) => (current - 1 + vehicles.length) % vehicles.length);
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % vehicles.length);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="photo-frame overflow-hidden flex flex-col h-full">
            <div className="relative aspect-[4/3] min-h-[340px] w-full shrink-0">
              <div
                className="relative w-full h-full"
                style={{
                  transform: `translateX(-${activeIndex * 100}%)`,
                }}
              >
                {vehicles.map((vehicle, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      left: `${idx * 100}%`,
                    }}
                  >
                    <Image
                      src={vehicle.src}
                      alt={vehicle.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 45vw"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/70 p-5 text-white flex-1">
              <div className="text-base font-semibold">{vehicles[activeIndex].title}</div>
              <p className="mt-2 text-sm leading-6">{vehicles[activeIndex].desc}</p>
            </div>
          </div>

          <div className="photo-frame overflow-hidden flex flex-col h-full">
            <div className="relative aspect-[4/3] min-h-[340px] w-full shrink-0">
              <div
                className="relative w-full h-full"
                style={{
                  transform: `translateX(-${((activeIndex + 1) % vehicles.length) * 100}%)`,
                }}
              >
                {vehicles.map((vehicle, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      left: `${idx * 100}%`,
                    }}
                  >
                    <Image
                      src={vehicle.src}
                      alt={vehicle.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 45vw"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/70 p-5 text-white flex-1">
              <div className="text-base font-semibold">
                {vehicles[(activeIndex + 1) % vehicles.length].title}
              </div>
              <p className="mt-2 text-sm leading-6">
                {vehicles[(activeIndex + 1) % vehicles.length].desc}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 bg-black/50 hover:bg-black/70 rounded-full p-3 transition"
          aria-label="Veículo anterior"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 bg-black/50 hover:bg-black/70 rounded-full p-3 transition"
          aria-label="Próximo veículo"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {vehicles.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              index === activeIndex ? "bg-white" : "bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Mostrar ${vehicles[index].title}`}
          />
        ))}
      </div>
    </div>
  );
}
