import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  Plus,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import type { Problem, ProblemGroup, TestCase } from "../types";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "../components/UI";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
const supabaseBucket =
  (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) || "problems";
export default function AdminProblems() {
  const [groups, setGroups] = useState<ProblemGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState<"problem" | "testcase" | null>(null);
  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [timeLimit, setTimeLimit] = useState("1000");
  const [memoryLimit, setMemoryLimit] = useState("128");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [problemId, setProblemId] = useState("");
  const [inputData, setInputData] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [isSample, setIsSample] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  async function loadGroups() {
    const data = await request<ProblemGroup[]>(api.get("/problem-groups"));
    setGroups(data);
    if (!selectedGroup && data.length) setSelectedGroup(String(data[0].id));
  }
  async function loadProblems(gid = selectedGroup) {
    if (!gid) {
      setProblems([]);
      return;
    }
    setLoading(true);
    try {
      const detail = await request<ProblemGroup & { problems: Problem[] }>(
        api.get(`/problem-groups/${gid}`),
      );
      setProblems(detail.problems || []);
    } catch (e) {
      setError(getErrorMessage(e));
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadGroups()
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (selectedGroup) void loadProblems(selectedGroup);
  }, [selectedGroup]);
  async function uploadPdf(): Promise<string> {
    if (!file) return pdfUrl;
    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      (file.type && file.type !== "application/pdf")
    )
      throw new Error("File harus berformat PDF.");
    if (file.size > 15 * 1024 * 1024)
      throw new Error("Ukuran PDF maksimal 15 MB.");
    if (!supabaseUrl || !supabaseKey)
      throw new Error(
        "Konfigurasi Supabase belum diisi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada .env.",
      );
    setUploading(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from(supabaseBucket)
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }
  async function createProblem(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = await uploadPdf();
      if (!url)
        throw new Error("Pilih PDF atau masukkan URL PDF terlebih dahulu.");
      await request<Problem>(
        api.post("/problems", {
          group_id: Number(selectedGroup),
          title: title.trim(),
          pdf_url: url,
          time_limit_ms: Number(timeLimit),
          memory_limit_mb: Number(memoryLimit),
        }),
      );
      setSuccess("Soal berhasil dibuat.");
      setModal(null);
      setTitle("");
      setPdfUrl("");
      setFile(null);
      await loadProblems();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function addTestCase(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request<TestCase>(
        api.post(`/problems/${problemId}/test-cases`, {
          input_data: inputData,
          expected_output: expectedOutput,
          is_sample: isSample,
        }),
      );
      setSuccess(`Test case berhasil ditambahkan ke problem #${problemId}.`);
      setModal(null);
      setInputData("");
      setExpectedOutput("");
      await loadProblems();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="PROBLEM CONFIGURATION"
        title="Manajemen soal"
        description="Buat problem, unggah PDF statement, dan siapkan test case."
        actions={
          <Button
            onClick={() => {
              setError("");
              setModal("problem");
            }}
            disabled={!groups.length}
          >
            <Plus size={16} /> Buat soal
          </Button>
        }
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert kind="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <div className="problem-admin-controls">
        <div className="field">
          <span className="field-label">Problem group</span>
          <Select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">Pilih problem group</option>
            {groups.map((g) => (
              <option value={g.id} key={g.id}>
                {g.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="problem-admin-count">
          <FileText size={17} />
          <span>{problems.length} soal pada sesi ini</span>
        </div>
      </div>
      <section className="panel admin-table-panel">
        <div className="panel-header">
          <div>
            <h2>Daftar soal</h2>
            <p>Kelola statement dan test cases setiap problem.</p>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : problems.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>PDF statement</th>
                  <th>Time limit</th>
                  <th>Memory limit</th>
                  <th>Test cases</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <div className="problem-table-title">
                        <div className="problem-index">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <strong>{p.title}</strong>
                          <span>Problem #{p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        className="table-action-link"
                        href={p.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText size={14} /> Lihat PDF
                      </a>
                    </td>
                    <td>{p.time_limit_ms} ms</td>
                    <td>{p.memory_limit_mb} MB</td>
                    <td>
                      <Badge tone="neutral">Dikelola via form</Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setProblemId(String(p.id));
                          setModal("testcase");
                        }}
                      >
                        <Plus size={14} /> Test case
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada soal pada sesi ini"
            description="Pilih problem group lain atau buat soal baru."
            action={
              <Button
                onClick={() => setModal("problem")}
                disabled={!selectedGroup}
              >
                <Plus size={15} /> Buat soal
              </Button>
            }
          />
        )}
      </section>
      {!supabaseUrl && (
        <div className="admin-info-note">
          <UploadCloud size={18} />
          <div>
            <strong>Supabase Storage belum dikonfigurasi</strong>
            <p>
              Upload PDF langsung membutuhkan VITE_SUPABASE_URL,
              VITE_SUPABASE_ANON_KEY, dan bucket public yang sesuai. Kamu juga
              bisa memasukkan URL PDF yang sudah ada.
            </p>
          </div>
        </div>
      )}
      {modal === "problem" && (
        <Modal title="Buat soal baru" onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={createProblem}>
            <p className="modal-description">
              PDF akan diunggah ke Supabase Storage dari browser. URL publik
              disimpan oleh backend.
            </p>
            <Field label="Problem group">
              <Select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                required
              >
                <option value="">Pilih problem group</option>
                {groups.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Judul soal">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
                placeholder="Contoh: A. Reverse String"
              />
            </Field>
            <Field
              label="PDF statement"
              hint="PDF maksimal 15 MB. Bucket Supabase harus mengizinkan upload dari anon key sesuai policy yang kamu atur."
            >
              <div
                className="upload-zone"
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fileRef.current?.click();
                }}
              >
                <UploadCloud size={22} />
                <strong>{file?.name || "Pilih file PDF"}</strong>
                <span>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : "Klik untuk memilih file"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <span className="field-hint">
                Atau isi URL PDF yang sudah diunggah
              </span>
              <Input
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                type="url"
                placeholder="https://.../storage/v1/object/public/..."
              />
            </Field>
            <div className="form-grid-2">
              <Field label="Time limit (ms)">
                <Input
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  required
                />
              </Field>
              <Field label="Memory limit (MB)">
                <Input
                  type="number"
                  min="1"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(e.target.value)}
                  required
                />
              </Field>
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy || uploading}>
                {uploading
                  ? "Mengunggah PDF..."
                  : busy
                    ? "Menyimpan..."
                    : "Buat soal"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "testcase" && (
        <Modal
          title={`Tambah test case · Problem #${problemId}`}
          onClose={() => setModal(null)}
        >
          <form className="modal-form" onSubmit={addTestCase}>
            <p className="modal-description">
              Input dan expected output harus mengikuti format persis yang
              digunakan evaluator.
            </p>
            <Field label="Input data">
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                required
                rows={5}
                placeholder={"5\n1 2 3 4 5"}
              />
            </Field>
            <Field label="Expected output">
              <Textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                required
                rows={4}
                placeholder="15"
              />
            </Field>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isSample}
                onChange={(e) => setIsSample(e.target.checked)}
              />
              <span>
                <strong>Sample test case</strong>
                <small>
                  Jika aktif, input dan output dapat dilihat peserta.
                </small>
              </span>
            </label>
            {error && <Alert>{error}</Alert>}
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan test case"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
