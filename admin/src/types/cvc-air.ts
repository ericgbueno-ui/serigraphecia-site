// Tipos baseados nos schemas Swagger oficiais do Conectaas CVC B2B — Aéreo
// Ref: devportal.cvccorp.com.br/pt-BR/logged/documentation/air-b2b#api

// ─── Primitivos ───────────────────────────────────────────────────────────────

export interface AirCompany {
  iata?: string;
  name?: string;
}

export interface SeatClass {
  code?: string;
  description?: string;
}

export interface Edge {
  iata?: string;
  date?: string;   // ISO datetime
  terminal?: string;
}

export interface Arrival {
  iata?: string;
  date?: string;
  terminal?: string;
}

export interface StopOver {
  airport?: string;
  arrivalDate?: string;
  departureDate?: string;
}

export interface Tax {
  code?: string;
  description?: string;
  percent?: number;
  values?: Value[];
}

export interface Value {
  amount?: number;
  currency?: string;
}

export interface Baggage {
  isIncluded?: boolean;
  quantity?: number;
  type?: string;    // "CHECKED" | "CARRY_ON" etc.
  uom?: string;
  weight?: number;
}

export interface Service {
  description?: string;
  isIncluded?: boolean;
  type?: string;
}

// ─── Fare / Price ─────────────────────────────────────────────────────────────

export interface PriceInfo {
  baseFare?: number;
  currency?: string;
  exchangeRate?: number;
}

export interface FareDTO {
  priceSaleWithTax?: number;
  priceSaleWithoutTax?: number;
  passengersCount?: number;
  passengersType?: string;  // "ADT" | "CHD" | "INF"
  taxes?: Tax[];
}

export interface AncillaryFareDTO {
  ancillariesId?: string[];
  originalPriceInfo?: PriceInfo;
  priceWithTax?: number;
  priceWithoutTax?: number;
  taxes?: Tax[];
}

export interface FareGroup {
  priceSaleWithoutTax?: number;
  priceSaleWithTax?: number;
  fares?: FareDTO[];
  ancillaryFare?: AncillaryFareDTO[];
  reCharging?: boolean;
  originalPriceInfo?: PriceInfo;
  currency?: string;
}

export interface DueGroupDTO {
  currency?: string;
  fares?: FareDTO[];
  priceWithTax?: number;
  priceWithoutTax?: number;
}

export interface Profile {
  baggage?: Baggage;
  fareFamily?: string;
  fareFamilyId?: string;
  fareFamilyProgramId?: string;
  services?: Service[];
}

// ─── Legs / Segments ─────────────────────────────────────────────────────────

export interface Leg {
  aircraftCode?: string;
  arrival?: Edge;
  departure?: Edge;
  duration?: number;       // minutes
  fareBasis?: string;
  fareClass?: string;
  flightNumber?: number;
  managedBy?: AirCompany;
  numberOfStops?: number;
  operatedBy?: AirCompany;
  seatClass?: SeatClass;
  status?: string;
  stops?: StopOver[];
  seatsLeft?: number;
}

export interface SegmentDTO {
  departure?: Edge;
  arrival?: Arrival;
  duration?: number;
  fareProfile?: Profile;
  fareType?: string;
  legs?: Leg[];
  numberOfStops?: number;
  productToken?: string;   // ← token a usar no booking
  national?: boolean;
  routeRPH?: number;
}

export interface FlightMessageDTO {
  code?: number;
  message?: string;
  priority?: number;
  type?: string;
}

// ─── FlightDTO — resultado principal da busca ─────────────────────────────────
// Cada FlightDTO é uma opção de viagem completa.
// segments[0] = ida, segments[1] = volta (se ida e volta)

export interface FlightDTO {
  fareGroup?: FareGroup;
  airCompany?: AirCompany;
  airlineBalanceDueGroup?: DueGroupDTO;
  balanceDueGroup?: DueGroupDTO;
  messages?: FlightMessageDTO[];
  segments?: SegmentDTO[];
  provider?: string;
  type?: string;
  validatingBy?: AirCompany;
}

// ─── AirAvailabilityResponseDTO — resposta da busca ──────────────────────────

export interface AirportDTO {
  iata?: string;
  location?: CityNameDTO;
  name?: string;
  stop?: boolean;
}

export interface CityNameDTO {
  name?: string;
}

export interface DepartureDatesRangeDTO {
  maximum?: string;
  minimum?: string;
}

export interface FlightDurationRange {
  maximum?: number;
  minimum?: number;
}

export interface PriceRange {
  currency?: string;
  maxWithTax?: number;
  maxWithoutTax?: number;
  minWithTax?: number;
  minWithoutTax?: number;
}

export interface PriceMatrixColumnRow {
  bestPrice?: boolean;
  numberOfStops?: number;
  price?: number;
  priceWithoutTax?: number;
}

export interface PriceMatrixColumn {
  airCompanies?: AirCompany[];
  rows?: PriceMatrixColumnRow[];
}

export interface PriceMatrix {
  columns?: PriceMatrixColumn[];
  currency?: string;
}

export interface StatusExecution {
  completedExecution?: boolean;
  executed?: number;
  started?: string;
  total?: number;
}

export interface Metadata {
  airports?: AirportDTO[];
  countFlights?: number;
  countPriceGroups?: number;
  price?: PriceRange;
  priceMatrix?: PriceMatrix;
  routes?: RouteMetaDTO[];
  statusExecution?: StatusExecution;
}

export interface RouteMetaDTO {
  airCompanies?: AirCompany[];
  airports?: AirportDTO[];
  baggageIncluded?: boolean[];
  departureDates?: DepartureDatesRangeDTO;
  fareType?: string[];
  flightDuration?: FlightDurationRange;
  numberOfStops?: number[];
  rph?: number;
}

export interface AirAvailabilityResponseDTO {
  flights?: FlightDTO[];
  metadata?: Metadata;
}

// ─── FareAvailability — agrupamento de tokens para booking ───────────────────

export interface FareAvailability {
  productTokens?: string[];
}

export interface FareAvailabilityResponse {
  priceGroup?: FlightDTO;
  meta?: MetaFlightListDTO;
}

export interface MetaFlightListDTO {
  associatedFares?: FlightDTO[];
}

// ─── Airport static data ─────────────────────────────────────────────────────

export interface Airport {
  name?: string;
  iata?: string;
  iataHub?: string;
  latitude?: number;
  longitude?: number;
  location?: LocationAirport;
}

export interface LocationAirport {
  id?: number;
  name?: string;
  countryId?: number;
  countryName?: string;
  stateId?: number;
  stateName?: string;
  stateAbbreviation?: string;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export interface DocumentPaxValidadePreBooking {
  type?: string;          // "RF" | "CPF" | "PASSPORT"
  number?: string;
  expirationDate?: string;
  issuingCountry?: string;
  nationality?: string;
}

export interface PhoneValidadePreBooking {
  internationalCode?: number;
  localCode?: number;
  number?: number;
  type?: "MOBILE" | "LANDLINE";
}

export interface PaxValidadePreBooking {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "F" | "M";
  email?: string;
  phones?: PhoneValidadePreBooking[];
  documents?: DocumentPaxValidadePreBooking[];
  eticket?: string;
}

export interface CreditCard {
  flag?: string;
  number?: number;
  securityCode?: number;
  holder?: string;
  expiryMonth?: number;
  expiryYear?: number;
  value?: number;
  countInstallments?: number;
}

export interface Payment {
  paymentModeId?: number;
  amount?: number;
  currency?: "BRL" | "USD";
  creditCard?: CreditCard;
}

export interface BookingRequest {
  packageId?: number;
  productTokens: string[];
  paxs: PaxValidadePreBooking[];
  payment?: Payment;
}

export interface InformationDTO {
  cofr?: string;
  message?: string;
}

export interface PriceGroupBooking {
  validatingBy?: AirCompany;
  fareGroup?: FareGroup;
  segments?: SegmentDTO[];
}

export interface BookingResponse {
  bookingId?: number;
  status?: "INITIATED" | "BOOKED" | "CONFIRMED" | "CANCELLED" | "FAILED";
  packageId?: number;
  bookingSigId?: number;
  correlationId?: string;
  paxs?: PaxValidadePreBooking[];
  creationDate?: string;
  issueDateTimeLimit?: string;
  bookingDateTimeLimit?: string;
  priceGroup?: PriceGroupBooking;
  packageGroup?: string;
  fareType?: string;
  fareCodes?: string;
  ssrs?: InformationDTO;
}

export interface CommitRequest {
  payment: Payment;
}

export interface ValidatePreBookingRequest {
  agencyId?: number;
  productTokens: string[];
  paxs: PaxValidadePreBooking[];
}

export interface ValidatePreBookingResponse {
  validationReturn?: string;
}

export interface ExceptionResponse {
  timestamp?: string;
  message?: string;
  correlationId?: string;
}
