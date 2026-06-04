export type ABStats = {
  views: number;
  clicks: number;
  conversions: number;
};

export const abDatabase = {
  A: { views: 0, clicks: 0, conversions: 0 } as ABStats,
  B: { views: 0, clicks: 0, conversions: 0 } as ABStats,
  winner: null as "A" | "B" | null,
};
