// Realistic fixtures shaped like Google Places API (New) responses.
// 5 without websites (qualify as leads) + 3 with websites (filtered out).

import type { PlaceResult } from "./places";

export const MOCK_PLACES: PlaceResult[] = [
  {
    id: "ChIJmock_phx_001",
    displayName: { text: "Reyes Plumbing & Drain" },
    formattedAddress: "1234 N Central Ave, Phoenix, AZ 85004",
    nationalPhoneNumber: "(602) 555-0143",
    rating: 4.9,
    userRatingCount: 127,
    types: ["plumber", "point_of_interest"],
    // no websiteUri → lead
  },
  {
    id: "ChIJmock_phx_002",
    displayName: { text: "Desert Sun Plumbing" },
    formattedAddress: "5500 E Indian School Rd, Phoenix, AZ 85018",
    nationalPhoneNumber: "(602) 555-0098",
    websiteUri: "https://desertsunplumbing.com",
    rating: 4.7,
    userRatingCount: 89,
    types: ["plumber"],
  },
  {
    id: "ChIJmock_phx_003",
    displayName: { text: "Phoenix Pipe Pros" },
    formattedAddress: "8800 N 19th Ave, Phoenix, AZ 85021",
    nationalPhoneNumber: "(623) 555-0211",
    rating: 4.6,
    userRatingCount: 41,
    types: ["plumber"],
    // no website → lead
  },
  {
    id: "ChIJmock_phx_004",
    displayName: { text: "AAA Emergency Plumbing" },
    formattedAddress: "200 W Camelback Rd, Phoenix, AZ 85013",
    nationalPhoneNumber: "(602) 555-0177",
    websiteUri: "https://aaaemergencyplumbing.com",
    rating: 4.5,
    userRatingCount: 312,
    types: ["plumber"],
  },
  {
    id: "ChIJmock_phx_005",
    displayName: { text: "Valley Drain Solutions" },
    formattedAddress: "3411 W Thomas Rd, Phoenix, AZ 85017",
    nationalPhoneNumber: "(602) 555-0064",
    rating: 5.0,
    userRatingCount: 18,
    types: ["plumber"],
    // no website → lead
  },
  {
    id: "ChIJmock_phx_006",
    displayName: { text: "Sonoran Plumbing Co" },
    formattedAddress: "7710 S 32nd St, Phoenix, AZ 85042",
    nationalPhoneNumber: "(602) 555-0202",
    rating: 4.8,
    userRatingCount: 56,
    types: ["plumber"],
    // no website → lead
  },
  {
    id: "ChIJmock_phx_007",
    displayName: { text: "Cactus Plumbing" },
    formattedAddress: "1900 E McDowell Rd, Phoenix, AZ 85006",
    nationalPhoneNumber: "(602) 555-0023",
    websiteUri: "https://cactusplumbing.net",
    rating: 4.2,
    userRatingCount: 73,
    types: ["plumber"],
  },
  {
    id: "ChIJmock_phx_008",
    displayName: { text: "Maricopa 24/7 Plumbers" },
    formattedAddress: "12030 N Cave Creek Rd, Phoenix, AZ 85020",
    nationalPhoneNumber: "(602) 555-0119",
    rating: 4.4,
    userRatingCount: 9,
    types: ["plumber"],
    // no website → lead
  },
];
