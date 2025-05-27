export interface Case {
  id: string;
  title: string;
  location: string;
  initial_report_path: string; // Path to the uploaded initial report in Supabase Storage
  final_report_content?: string;
  created_at: string;
  updated_at: string;
  status: 'Open' | 'InProgress' | 'Completed' | 'Closed';
  user_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  // Add other profile fields as needed
}
