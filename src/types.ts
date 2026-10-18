export type Role = "ADMIN" | "USER";
export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  created_at?: string;
}
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error: { code: string; details?: string } | null;
}
export type GroupStatus = "UPCOMING" | "ONGOING" | "ENDED";
export interface ProblemGroup {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: GroupStatus;
  total_problems?: number;
  created_by?: number;
  created_at?: string;
}
export type UserProblemStatus =
  | "AC"
  | "FIRST_BLOOD"
  | "ATTEMPTED"
  | "NOT_ATTEMPTED";
export interface Problem {
  id: number;
  group_id: number;
  title: string;
  pdf_url: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  user_status?: UserProblemStatus;
  first_blood_user?: { id: number; username: string; name: string } | null;
  sample_test_cases?: TestCase[];
}
export interface TestCase {
  id?: number;
  input_data: string;
  expected_output: string;
  is_sample?: boolean;
}
export type Verdict =
  | "PENDING"
  | "RUNNING"
  | "AC"
  | "WA"
  | "CE"
  | "TLE"
  | "RTE";
export interface Submission {
  id: number;
  user_id?: number;
  problem_id: number;
  language: "c" | "cpp";
  code?: string;
  verdict: Verdict;
  execution_time_ms?: number;
  compile_output?: string;
  submitted_at: string;
}
export interface ScoreStatus {
  verdict: Verdict | "NOT_ATTEMPTED";
  is_first_blood: boolean;
  color_code: "DARK_GREEN" | "LIGHT_GREEN" | "RED" | "GRAY";
  attempt_count: number;
}
export interface Ranking {
  rank: number;
  user_id: number;
  username: string;
  name: string;
  total_solved: number;
  submissions_status: Record<string, ScoreStatus>;
}
export interface Scoreboard {
  group_id: number;
  group_title: string;
  problems: { id: number; title: string }[];
  rankings: Ranking[];
}
