export interface Case {
  id: string;
  title: string;
  location: string;
  initialReportPath: string; // Path to the uploaded initial report in Supabase Storage
  finalReportContent?: string;
  createdAt: string;
  updatedAt: string;
  status: 'Open' | 'InProgress' | 'Completed' | 'Closed';
  userId: string;
}

export interface UserProfile {
  id: string;
  email: string;
  // Add other profile fields as needed
}
