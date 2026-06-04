// Tipos derivados dos schemas Swagger do Conectaas CVC B2B — Hotéis
// Ref: devportal.cvccorp.com.br/pt-BR/logged/documentation/hotels-b2b

// ─── Carga Estática ───────────────────────────────────────────────────────────

export interface Location {
  id?: string | number;
  name?: string;
  type?: string;       // "CITY" | "AIRPORT" | "REGION" etc.
  country?: string;
  state?: string;
}

export interface HotelPortfolioItem {
  id?: string | number;
  hotelId?: string | number;
  name?: string;
  category?: string;  // stars: "1" – "5"
  location?: Location | string;
  locationId?: string | number;
  address?: string;
  city?: string;
  country?: string;
  images?: string[];
  thumbnail?: string;
  amenities?: string[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface RoomRequest {
  adults: number;
  children?: number;
  childAges?: number[];
}

export interface HotelSearchRequest {
  locationId?: string | number;
  hotelId?: string | number;
  checkIn: string;     // "YYYY-MM-DD"
  checkOut: string;
  rooms: RoomRequest[];
  domain?: "AGENCIA" | "CORPORATIVO";
  nationality?: string;
  currency?: string;
}

export interface HotelImage {
  url?: string;
  type?: string;
  description?: string;
}

export interface HotelCategory {
  stars?: number | string;
  description?: string;
}

export interface RoomType {
  id?: string | number;
  name?: string;
  description?: string;
  maxOccupancy?: number;
  bedType?: string;
  refundable?: boolean;
  breakfastIncluded?: boolean;
}

export interface HotelPrice {
  total?: number;
  dailyRate?: number;
  currency?: string;
  taxes?: number;
  fees?: number;
  discount?: number;
}

export interface HotelOffer {
  productToken: string;
  hotelId?: string | number;
  name?: string;
  category?: HotelCategory | number | string;
  stars?: number;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  images?: HotelImage[] | string[];
  thumbnail?: string;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  room?: RoomType;
  rooms?: RoomType[];
  price?: HotelPrice;
  totalPrice?: number;
  currency?: string;
  refundable?: boolean;
  breakfastIncluded?: boolean;
  cancellationPolicy?: string;
  messages?: string[];
}

export interface HotelSearchResponse {
  hotels?: HotelOffer[];
  results?: HotelOffer[];
  offers?: HotelOffer[];
  totalResults?: number;
  metadata?: { totalResults?: number; page?: number };
}

// ─── Price ────────────────────────────────────────────────────────────────────

export interface HotelPriceRequest {
  productToken: string;
}

export interface HotelPriceResponse {
  productToken?: string;
  price?: HotelPrice;
  room?: RoomType;
  refundable?: boolean;
  breakfastIncluded?: boolean;
  cancellationPolicy?: string;
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface HotelDetailRequest {
  productToken: string;
}

export interface HotelDetailResponse extends HotelOffer {
  facilities?: string[];
  policies?: string;
  checkinTime?: string;
  checkoutTime?: string;
  rating?: number;
  reviewCount?: number;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  document?: string;
  documentType?: string;
}

export interface HotelBookingRequest {
  productToken: string;
  guests: GuestInfo[];
  payment?: HotelPayment;
  specialRequests?: string;
}

export interface HotelPayment {
  paymentModeId?: number;
  amount?: number;
  currency?: string;
  creditCard?: {
    flag?: string;
    number?: string | number;
    securityCode?: string | number;
    holder?: string;
    expiryMonth?: number;
    expiryYear?: number;
    value?: number;
    countInstallments?: number;
  };
}

export interface HotelBookingResponse {
  bookingId?: string | number;
  locator?: string;
  status?: string;
  hotel?: Partial<HotelOffer>;
  price?: HotelPrice;
  messages?: string[];
}

export interface HotelCommitRequest {
  payment: HotelPayment;
}

export interface HotelCancellationRequest {
  reasonForCancellation?: string;
}
