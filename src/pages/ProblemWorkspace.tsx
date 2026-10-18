import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import type { Problem, Submission, Verdict } from "../types";
import { Badge, Button, Alert, Loading } from "../components/UI";
import { formatDate, verdictLabel } from "../lib/utils";
const templates = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here\n\n    return 0;\n}\n",
  c: "#include <stdio.h>\n\nint main(void) {\n    // Write your solution here\n\n    return 0;\n}\n",
};
const terminalText = (s: Submission) =>
  s.verdict === "AC"
    ? "All test cases passed."
    : s.verdict === "WA"
      ? "Output does not match the expected answer."
      : s.verdict === "CE"
        ? s.compile_output || "Compilation failed."
        : s.verdict === "TLE"
          ? "Time limit exceeded."
          : s.verdict === "RTE"
            ? "Runtime error while executing your program."
            : s.verdict === "RUNNING"
              ? "Your code is running in the sandbox..."
              : "Submission is waiting in the queue...";
export default function ProblemWorkspace() {
  const { id } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"cpp" | "c">("cpp");
  const [code, setCode] = useState(templates.cpp);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"description" | "submissions">("description");
  const [fullscreen, setFullscreen] = useState(false);
  const pollRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    request<Problem>(api.get(`/problems/${id}`))
      .then(setProblem)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [id]);
  useEffect(() => {
    setCode(templates[language]);
  }, [language]);
  async function pollSubmission(submissionId: number) {
    let tries = 0;
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      tries++;
      try {
        const next = await request<Submission>(
          api.get(`/submissions/${submissionId}`),
        );
        setSubmission(next);
        if (!["PENDING", "RUNNING"].includes(next.verdict) || tries > 90) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setSubmitting(false);
        }
      } catch {
        if (tries > 10) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setSubmitting(false);
        }
      }
    }, 1500);
  }
  async function submit() {
    if (!problem) return;
    setSubmitting(true);
    setError("");
    setTab("submissions");
    try {
      const data = await request<{
        submission_id: number;
        status: Verdict;
        submitted_at: string;
      }>(api.post("/submissions", { problem_id: problem.id, language, code }));
      setSubmission({
        id: data.submission_id,
        problem_id: problem.id,
        language,
        code,
        verdict: data.status,
        submitted_at: data.submitted_at,
      });
      void pollSubmission(data.submission_id);
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  }
  if (loading) return <Loading label="Menyiapkan problem workspace..." />;
  if (error && !problem) return <Alert>{error}</Alert>;
  if (!problem) return null;
  return (
    <div
      className={`workspace-page ${fullscreen ? "workspace-fullscreen" : ""}`}
    >
      <div className="workspace-topline">
        <Link to={`/groups/${problem.group_id}`} className="back-link">
          <ArrowLeft size={15} /> Problem group
        </Link>
        <div className="workspace-top-actions">
          <span className="workspace-language-dot" />{" "}
          <span>Judge environment ready</span>
          <button
            className="icon-btn"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Keluar fullscreen" : "Fullscreen"}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="workspace-title">
        <div>
          <div className="eyebrow">
            PROBLEM #{problem.id} / GROUP #{problem.group_id}
          </div>
          <h1>{problem.title}</h1>
          <div className="workspace-meta">
            <span>
              <Timer size={14} />
              {problem.time_limit_ms} ms time limit
            </span>
            <span>
              <ShieldAlert size={14} />
              {problem.memory_limit_mb} MB memory
            </span>
            {problem.first_blood_user && (
              <span className="first-blood-meta">
                <CheckCircle2 size={14} /> First Blood:{" "}
                {problem.first_blood_user.name}
              </span>
            )}
          </div>
        </div>
        <Badge tone="green">C / C++</Badge>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="workspace-grid">
        <section className="workspace-left panel">
          <div className="workspace-tabs">
            <button
              className={tab === "description" ? "active" : ""}
              onClick={() => setTab("description")}
            >
              <FileText size={16} /> Problem
            </button>
            <button
              className={tab === "submissions" ? "active" : ""}
              onClick={() => setTab("submissions")}
            >
              <Clock3 size={16} /> Submission result
            </button>
          </div>
          {tab === "description" ? (
            <div className="problem-description">
              <div className="pdf-toolbar">
                <div>
                  <FileText size={17} />
                  <span>Problem statement</span>
                </div>
                <a
                  href={problem.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Buka PDF <ExternalLink size={14} />
                </a>
              </div>
              {problem.pdf_url ? (
                <iframe
                  title="Problem statement PDF"
                  src={`${problem.pdf_url}#toolbar=1&navpanes=0`}
                  className="pdf-frame"
                />
              ) : (
                <div className="pdf-empty">PDF soal belum tersedia.</div>
              )}
              {problem.sample_test_cases?.length ? (
                <div className="sample-cases">
                  <h3>Sample test cases</h3>
                  {problem.sample_test_cases.map((tc, i) => (
                    <div className="sample-case" key={tc.id || i}>
                      <div className="sample-case-title">Example {i + 1}</div>
                      <div className="sample-case-grid">
                        <div>
                          <label>Input</label>
                          <pre>{tc.input_data}</pre>
                        </div>
                        <div>
                          <label>Expected output</label>
                          <pre>{tc.expected_output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="submission-result">
              {submission ? (
                <>
                  <div
                    className={`verdict-banner verdict-banner-${submission.verdict.toLowerCase()}`}
                  >
                    <div className="verdict-big-icon">
                      {submission.verdict === "AC" ? (
                        <CheckCircle2 size={26} />
                      ) : ["WA", "CE", "TLE", "RTE"].includes(
                          submission.verdict,
                        ) ? (
                        <XCircle size={26} />
                      ) : (
                        <Clock3 size={26} />
                      )}
                    </div>
                    <div>
                      <strong>{verdictLabel(submission.verdict)}</strong>
                      <p>{terminalText(submission)}</p>
                    </div>
                    <Badge
                      tone={
                        submission.verdict === "AC"
                          ? "green"
                          : ["WA", "CE", "TLE", "RTE"].includes(
                                submission.verdict,
                              )
                            ? "red"
                            : "amber"
                      }
                    >
                      {submission.verdict}
                    </Badge>
                  </div>
                  <div className="result-metrics">
                    <div>
                      <span>Submission ID</span>
                      <strong>#{submission.id}</strong>
                    </div>
                    <div>
                      <span>Execution time</span>
                      <strong>{submission.execution_time_ms ?? "—"} ms</strong>
                    </div>
                    <div>
                      <span>Submitted at</span>
                      <strong>{formatDate(submission.submitted_at)}</strong>
                    </div>
                  </div>
                  {submission.compile_output && (
                    <div className="compile-output">
                      <div>Compiler output</div>
                      <pre>{submission.compile_output}</pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="result-placeholder">
                  <div className="result-placeholder-icon">
                    <Code2 size={24} />
                  </div>
                  <h3>Belum ada hasil submission</h3>
                  <p>
                    Submit kode untuk melihat verdict, execution time, dan
                    detail error.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
        <section className="editor-panel">
          <div className="editor-toolbar">
            <div className="editor-file">
              <span className="file-icon">
                {language === "cpp" ? "C+" : "C"}
              </span>
              <span>solution.{language === "cpp" ? "cpp" : "c"}</span>
              <span className="unsaved-dot" title="Editor aktif" />
            </div>
            <div className="editor-toolbar-right">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "c" | "cpp")}
                aria-label="Bahasa pemrograman"
              >
                <option value="cpp">C++ (G++17)</option>
                <option value="c">C (GCC)</option>
              </select>
              <button
                className="icon-btn"
                onClick={() => setCode(templates[language])}
                title="Reset template"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : "c"}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                fontSize: 14,
                fontFamily: "JetBrains Mono, Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: "on",
                padding: { top: 18, bottom: 18 },
                lineNumbers: "on",
                renderLineHighlight: "all",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
          <div className="editor-footer">
            <div className="editor-status">
              <span>Ln {code.split("\n").length}</span>
              <span>UTF-8</span>
              <span>{language === "cpp" ? "C++17" : "C17"}</span>
            </div>
            <Button onClick={submit} disabled={submitting || !code.trim()}>
              <Send size={15} />
              {submitting ? "Mengirim..." : "Submit solution"}
            </Button>
          </div>
          <div className="submit-hint">
            <Clock3 size={13} /> Kamu dapat melakukan submission berkali-kali
            selama sesi aktif.
          </div>
        </section>
      </div>
    </div>
  );
}
