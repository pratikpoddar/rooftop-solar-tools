import type { GenerationRegion } from "../types";

const VERIFIED_ON = "2026-09-08";
const SOURCE = "generation-by-state";

/**
 * Generation regions (spec §2.4). `monthlyFactors` are shares of annual output,
 * Jan→Dec, calibrated to the two anchors the spec gives: on the west coast a
 * July that is ~37% of March, and in the Jaipur belt a July that is ~58% of
 * March. They are normalised at read time, so small rounding drift is harmless.
 */
export const GENERATION_REGIONS: GenerationRegion[] = [
  {
    key: "west-coast-monsoon",
    label: "Konkan / Mumbai / west coast",
    kwhPerKwpYearMin: 1400,
    kwhPerKwpYearMax: 1500,
    monthlyFactors: [0.0959, 0.0935, 0.1102, 0.1039, 0.1006, 0.0575, 0.0412, 0.0479, 0.0668, 0.0939, 0.0946, 0.0939],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "northwest-arid",
    label: "Rajasthan / Gujarat / Punjab / Haryana / Delhi / west UP",
    kwhPerKwpYearMin: 1500,
    kwhPerKwpYearMax: 1800,
    monthlyFactors: [0.0743, 0.0797, 0.1041, 0.1061, 0.1069, 0.0899, 0.0604, 0.0632, 0.0809, 0.0883, 0.0764, 0.0697],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "north-plains",
    label: "Central & east UP / Uttarakhand / Himachal / J&K",
    kwhPerKwpYearMin: 1400,
    kwhPerKwpYearMax: 1550,
    monthlyFactors: [0.0672, 0.0763, 0.1056, 0.1096, 0.1104, 0.0947, 0.0595, 0.0595, 0.079, 0.094, 0.079, 0.0653],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "deccan",
    label: "Deccan plateau — interior Maharashtra, Telangana, AP, interior Karnataka, MP, Chhattisgarh, inland TN",
    kwhPerKwpYearMin: 1450,
    kwhPerKwpYearMax: 1600,
    monthlyFactors: [0.0904, 0.0898, 0.1067, 0.1006, 0.0949, 0.0682, 0.056, 0.0615, 0.0743, 0.0859, 0.0831, 0.0886],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "south-east-coast",
    label: "Coromandel coast — Chennai, coastal TN, coastal AP",
    kwhPerKwpYearMin: 1400,
    kwhPerKwpYearMax: 1520,
    monthlyFactors: [0.0895, 0.0905, 0.1056, 0.0996, 0.0967, 0.0866, 0.085, 0.085, 0.0823, 0.0644, 0.0537, 0.0609],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "east",
    label: "Bihar / Jharkhand / Odisha / West Bengal",
    kwhPerKwpYearMin: 1200,
    kwhPerKwpYearMax: 1450,
    monthlyFactors: [0.0902, 0.09, 0.1092, 0.1056, 0.0968, 0.0661, 0.057, 0.0589, 0.0661, 0.0854, 0.0873, 0.0873],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "kerala-coast",
    label: "Kerala / coastal Karnataka",
    kwhPerKwpYearMin: 1200,
    kwhPerKwpYearMax: 1450,
    monthlyFactors: [0.1081, 0.1002, 0.1109, 0.1001, 0.0865, 0.0546, 0.0517, 0.0611, 0.0728, 0.0733, 0.0819, 0.0987],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
  {
    key: "northeast",
    label: "North-East",
    kwhPerKwpYearMin: 1100,
    kwhPerKwpYearMax: 1150,
    monthlyFactors: [0.0864, 0.0867, 0.1056, 0.0929, 0.0816, 0.065, 0.0653, 0.072, 0.0789, 0.0912, 0.0882, 0.0864],
    lastVerified: VERIFIED_ON,
    confidence: "approximate",
    source: SOURCE,
  },
];
