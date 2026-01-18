
export enum SchoolLevel {
  K12 = 'K-12 Unified School (SD, SMP, SMA Gabungan)',
  ELEMENTARY = 'Elementary School (SD Only)',
  MIDDLE = 'Middle School (SMP Only)',
  HIGH = 'High School (SMA/SMK Only)',
  UNIVERSITY = 'University/College'
}

export interface FacultyMember {
  id: string;
  name: string;
  position: string;
  email: string;
  schoolName: string;
  schoolAddress: string;
  level: SchoolLevel;
  sourceUrl: string;
  salaryEstimate: string; // Estimated salary range based on research
  isK12Unified?: boolean;
}

export interface ResearchQuery {
  region: string;
  level: SchoolLevel;
  keywords: string;
  count: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
