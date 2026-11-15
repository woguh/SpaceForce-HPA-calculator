export type AltitudeGroupId = 'normal' | 'group1' | 'group2' | 'group3' | 'group4';

export interface AltitudeGroupSpec {
  id: AltitudeGroupId;
  label: string;
  shortLabel: string;
  elevationRangeFt: string;
  minElevationFt: number;
  maxElevationFt: number | null;
  hamrShuttleBonus: number;
  description: string;
  regulationRef: string;
}

export interface SpaceForceInstallation {
  id: string;
  name: string;
  stateOrCountry: string;
  branch: 'USSF' | 'USAF / Joint';
  majorUnit: string;
  geographicElevationFt: number;
  altitudeGroup: AltitudeGroupId;
  trackNotes: string;
}

export const ALTITUDE_GROUPS: Record<AltitudeGroupId, AltitudeGroupSpec> = {
  normal: {
    id: 'normal',
    label: 'Standard Elevation (< 5,250 ft MSL)',
    shortLabel: 'Normal (< 5,250 ft)',
    elevationRangeFt: '0 – 5,249 ft MSL',
    minElevationFt: 0,
    maxElevationFt: 5249,
    hamrShuttleBonus: 0,
    description:
      'Installations below 5,250 ft above mean sea level receive no altitude time deduction or shuttle adjustment per DAFMAN 36-2905 Attachment 3.',
    regulationRef: 'DAFMAN 36-2905, Attachment 3, Para A3.1',
  },
  group1: {
    id: 'group1',
    label: 'Altitude Group 1 (5,250 – 5,499 ft MSL)',
    shortLabel: 'Group 1 (5,250–5,499 ft)',
    elevationRangeFt: '5,250 – 5,499 ft MSL',
    minElevationFt: 5250,
    maxElevationFt: 5499,
    hamrShuttleBonus: 1,
    description:
      'Authorized cardiorespiratory adjustment for test altitude between 5,250 ft and 5,499 ft MSL (e.g., Kirtland AFB). Subtracts 0:02 to 0:08 from 2.0-Mile Run time (Table A3.1) or adds +1 shuttle to 20m HAMR (Table A3.4).',
    regulationRef: 'DAFMAN 36-2905, Attachment 3, Tables A3.1–A3.4 (Group 1)',
  },
  group2: {
    id: 'group2',
    label: 'Altitude Group 2 (5,500 – 5,999 ft MSL)',
    shortLabel: 'Group 2 (5,500–5,999 ft)',
    elevationRangeFt: '5,500 – 5,999 ft MSL',
    minElevationFt: 5500,
    maxElevationFt: 5999,
    hamrShuttleBonus: 2,
    description:
      'Authorized cardiorespiratory adjustment for test altitude between 5,500 ft and 5,999 ft MSL (e.g., Buckley SFB). Subtracts 0:06 to 0:22 from 2.0-Mile Run time (Table A3.1) or adds +2 shuttles to 20m HAMR (Table A3.4).',
    regulationRef: 'DAFMAN 36-2905, Attachment 3, Tables A3.1–A3.4 (Group 2)',
  },
  group3: {
    id: 'group3',
    label: 'Altitude Group 3 (6,000 – 6,599 ft MSL)',
    shortLabel: 'Group 3 (6,000–6,599 ft)',
    elevationRangeFt: '6,000 – 6,599 ft MSL',
    minElevationFt: 6000,
    maxElevationFt: 6599,
    hamrShuttleBonus: 3,
    description:
      'Authorized cardiorespiratory adjustment for test altitude between 6,000 ft and 6,599 ft MSL (e.g., Peterson SFB, Schriever SFB, F.E. Warren AFB). Subtracts 0:11 to 0:37 from 2.0-Mile Run time (Table A3.1) or adds +3 shuttles to 20m HAMR (Table A3.4).',
    regulationRef: 'DAFMAN 36-2905, Attachment 3, Tables A3.1–A3.4 (Group 3)',
  },
  group4: {
    id: 'group4',
    label: 'Altitude Group 4 (≥ 6,600 ft MSL)',
    shortLabel: 'Group 4 (≥ 6,600 ft)',
    elevationRangeFt: '6,600+ ft MSL',
    minElevationFt: 6600,
    maxElevationFt: null,
    hamrShuttleBonus: 4,
    description:
      'Maximum authorized cardiorespiratory adjustment for test altitude at or greater than 6,600 ft MSL (e.g., Cheyenne Mountain SFS, USAF Academy). Subtracts 0:18 to 1:02 from 2.0-Mile Run time (Table A3.1) or adds +4 shuttles to 20m HAMR (Table A3.4).',
    regulationRef: 'DAFMAN 36-2905, Attachment 3, Tables A3.1–A3.4 (Group 4)',
  },
};

export const SPACE_FORCE_INSTALLATIONS: SpaceForceInstallation[] = [
  {
    id: 'peterson-sfb',
    name: 'Peterson Space Force Base',
    stateOrCountry: 'Colorado, USA',
    branch: 'USSF',
    majorUnit: 'Space Operations Command (SpOC) HQ / Space Delta 2, 3, 7',
    geographicElevationFt: 6160,
    altitudeGroup: 'group3',
    trackNotes: 'Base outdoor track & Fitness Assessment Cell surveyed at ~6,160 ft MSL (Group 3).',
  },
  {
    id: 'schriever-sfb',
    name: 'Schriever Space Force Base',
    stateOrCountry: 'Colorado, USA',
    branch: 'USSF',
    majorUnit: 'Space Delta 6, 8, 9, 11, 12, 15',
    geographicElevationFt: 6260,
    altitudeGroup: 'group3',
    trackNotes: 'Outdoor running track surveyed at ~6,260 ft MSL (Group 3).',
  },
  {
    id: 'buckley-sfb',
    name: 'Buckley Space Force Base',
    stateOrCountry: 'Colorado, USA',
    branch: 'USSF',
    majorUnit: 'Space Delta 4 (Missile Warning)',
    geographicElevationFt: 5662,
    altitudeGroup: 'group2',
    trackNotes: 'Buckley Fitness Center track surveyed at 5,662 ft MSL (Group 2).',
  },
  {
    id: 'cheyenne-mtn-sfs',
    name: 'Cheyenne Mountain Space Force Station',
    stateOrCountry: 'Colorado, USA',
    branch: 'USSF',
    majorUnit: 'NORAD / USNORTHCOM Alternate Command Center',
    geographicElevationFt: 6780,
    altitudeGroup: 'group4',
    trackNotes: 'Station portal elevation >6,600 ft MSL (Group 4); members testing at Peterson SFB use Group 3.',
  },
  {
    id: 'vandenberg-sfb',
    name: 'Vandenberg Space Force Base',
    stateOrCountry: 'California, USA',
    branch: 'USSF',
    majorUnit: 'Space Launch Delta 30 / Space Delta 5, 14, 18',
    geographicElevationFt: 367,
    altitudeGroup: 'normal',
    trackNotes: 'Coastal marine elevation (367 ft MSL); below 5,250 ft threshold (no adjustment).',
  },
  {
    id: 'patrick-sfb',
    name: 'Patrick Space Force Base',
    stateOrCountry: 'Florida, USA',
    branch: 'USSF',
    majorUnit: 'Space Launch Delta 45 / Space Delta 10',
    geographicElevationFt: 10,
    altitudeGroup: 'normal',
    trackNotes: 'Sea-level coastal installation (10 ft MSL); no altitude adjustment applies.',
  },
  {
    id: 'cape-canaveral-sfs',
    name: 'Cape Canaveral Space Force Station',
    stateOrCountry: 'Florida, USA',
    branch: 'USSF',
    majorUnit: 'Space Launch Delta 45 (Eastern Range)',
    geographicElevationFt: 15,
    altitudeGroup: 'normal',
    trackNotes: 'Sea-level launch complex (15 ft MSL); no altitude adjustment applies.',
  },
  {
    id: 'los-angeles-afb',
    name: 'Los Angeles Air Force Base (Fort MacArthur)',
    stateOrCountry: 'California, USA',
    branch: 'USSF',
    majorUnit: 'Space Systems Command (SSC) HQ',
    geographicElevationFt: 105,
    altitudeGroup: 'normal',
    trackNotes: 'El Segundo / San Pedro elevation (~105 ft MSL); no altitude adjustment applies.',
  },
  {
    id: 'kirtland-afb',
    name: 'Kirtland Air Force Base',
    stateOrCountry: 'New Mexico, USA',
    branch: 'USAF / Joint',
    majorUnit: 'Space Rapid Capabilities Office (SpRCO) / SSC Innovation',
    geographicElevationFt: 5352,
    altitudeGroup: 'group1',
    trackNotes: 'Albuquerque mesa elevation surveyed at 5,352 ft MSL (Group 1).',
  },
  {
    id: 'usafa',
    name: 'United States Air Force Academy',
    stateOrCountry: 'Colorado, USA',
    branch: 'USAF / Joint',
    majorUnit: 'USSF Commissioning Detachment / Space Delta 13',
    geographicElevationFt: 7258,
    altitudeGroup: 'group4',
    trackNotes: 'Cadet & base athletic tracks surveyed at 6,600–7,258 ft MSL (Group 4).',
  },
  {
    id: 'fe-warren-afb',
    name: 'F.E. Warren Air Force Base',
    stateOrCountry: 'Wyoming, USA',
    branch: 'USAF / Joint',
    majorUnit: '90th Missile Wing / Joint Space Support',
    geographicElevationFt: 6155,
    altitudeGroup: 'group3',
    trackNotes: 'Cheyenne elevation surveyed at 6,155 ft MSL (Group 3).',
  },
  {
    id: 'cavalier-sfs',
    name: 'Cavalier Space Force Station',
    stateOrCountry: 'North Dakota, USA',
    branch: 'USSF',
    majorUnit: '10th Space Warning Squadron (PARCS)',
    geographicElevationFt: 1105,
    altitudeGroup: 'normal',
    trackNotes: 'Surveyed at 1,105 ft MSL; below 5,250 ft threshold (no adjustment).',
  },
  {
    id: 'clear-sfs',
    name: 'Clear Space Force Station',
    stateOrCountry: 'Alaska, USA',
    branch: 'USSF',
    majorUnit: '13th Space Warning Squadron',
    geographicElevationFt: 551,
    altitudeGroup: 'normal',
    trackNotes: 'Surveyed at 551 ft MSL; below 5,250 ft threshold (no adjustment).',
  },
  {
    id: 'cape-cod-sfs',
    name: 'Cape Cod Space Force Station',
    stateOrCountry: 'Massachusetts, USA',
    branch: 'USSF',
    majorUnit: '6th Space Warning Squadron (PAVE PAWS)',
    geographicElevationFt: 230,
    altitudeGroup: 'normal',
    trackNotes: 'Surveyed at 230 ft MSL; no altitude adjustment applies.',
  },
  {
    id: 'new-boston-sfs',
    name: 'New Boston Space Force Station',
    stateOrCountry: 'New Hampshire, USA',
    branch: 'USSF',
    majorUnit: '23rd Space Operations Squadron (Satellite Control)',
    geographicElevationFt: 780,
    altitudeGroup: 'normal',
    trackNotes: 'Surveyed at 780 ft MSL; no altitude adjustment applies.',
  },
  {
    id: 'pituffik-sb',
    name: 'Pituffik Space Base (formerly Thule AB)',
    stateOrCountry: 'Greenland',
    branch: 'USSF',
    majorUnit: '821st Space Base Group / 12th Space Warning Squadron',
    geographicElevationFt: 251,
    altitudeGroup: 'normal',
    trackNotes: 'Arctic coastal elevation (251 ft MSL); indoor track below 5,250 ft threshold.',
  },
  {
    id: 'pentagon-ncr',
    name: 'The Pentagon / National Capital Region',
    stateOrCountry: 'Virginia / D.C., USA',
    branch: 'USSF',
    majorUnit: 'Office of the Chief of Space Operations (OCSO) / STARCOM Elements',
    geographicElevationFt: 43,
    altitudeGroup: 'normal',
    trackNotes: 'Potomac basin elevation (43 ft MSL); no altitude adjustment applies.',
  },
];
