import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  FileText,
  LockKeyhole,
  Medal,
  Timer,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import { formatDate, groupStatusLabel } from "../lib/utils";
import type { Problem, ProblemGroup } from "../types";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Loading,
  PageHeader,
} from "../components/UI";
type GroupDetailData = ProblemGroup & { problems: Problem[] };
const statusTone = (s?: string) =>
  s === "AC" || s === "FIRST_BLOOD"
    ? "green"
    : s === "ATTEMPTED"
      ? "red"
      : "neutral";
export default function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    request<GroupDetailData>(api.get(`/problem-groups/${id}`))
      .then(setGroup)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <Link to="/groups" className="back-link">
          <ArrowLeft size={16} /> Kembali ke problem groups
        </Link>
        <Alert>{error}</Alert>
      </>
    );
  if (!group)
    return (
      <EmptyState
        title="Problem group tidak ditemukan"
        description="Data mungkin sudah dihapus atau kamu tidak memiliki akses."
      />
    );
  const canWork = group.status === "ONGOING";
  return (
    <>
      <Link to="/groups" className="back-link">
        <ArrowLeft size={16} /> Semua problem groups
      </Link>
      <div className="group-detail-hero">
        <div className="group-detail-main">
          <div className="eyebrow">PROBLEM GROUP / #{group.id}</div>
          <h1>{group.title}</h1>
          <p>
            {group.description ||
              "Tidak ada deskripsi untuk problem group ini."}
          </p>
          <div className="group-detail-badges">
            <Badge
              tone={
                group.status === "ONGOING"
                  ? "green"
                  : group.status === "UPCOMING"
                    ? "blue"
                    : "neutral"
              }
            >
              {groupStatusLabel(group.status)}
            </Badge>
            <span>
              <BookOpen size={15} />
              {group.problems?.length || 0} problems
            </span>
            <span>
              <Clock3 size={15} />
              {formatDate(group.start_time)} — {formatDate(group.end_time)}
            </span>
          </div>
        </div>
        <div className="detail-hero-art">
          <div className="detail-art-ring">
            <Code2Icon />
          </div>
          <span className="detail-art-tag">
            #{String(group.id).padStart(3, "0")}
          </span>
        </div>
      </div>
      {group.status === "UPCOMING" && (
        <Alert kind="info">
          Sesi ini belum dibuka. Kamu dapat melihat ringkasan, tetapi soal belum
          bisa diakses sampai waktu mulai.
        </Alert>
      )}
      {group.status === "ENDED" && (
        <Alert kind="info">
          Sesi sudah berakhir. Kamu masih dapat melihat daftar soal dan
          scoreboard, jika diizinkan oleh server.
        </Alert>
      )}
      <div className="section-heading">
        <div>
          <h2>Daftar soal</h2>
          <p>Urutan soal sesuai konfigurasi sesi.</p>
        </div>
        <Link to={`/scoreboards/${group.id}`}>
          <Button variant="secondary">
            <Medal size={16} /> Lihat scoreboard
          </Button>
        </Link>
      </div>
      {group.problems?.length ? (
        <div className="problem-list">
          {group.problems.map((p, i) => (
            <div className="problem-row" key={p.id}>
              <div className="problem-index">{String.fromCharCode(65 + i)}</div>
              <div className="problem-info">
                <Link to={`/problems/${p.id}`}>
                  <strong>{p.title}</strong>
                </Link>
                <div className="problem-meta">
                  <span>
                    <Timer size={13} />
                    {p.time_limit_ms} ms
                  </span>
                  <span>
                    <FileText size={13} />
                    {p.memory_limit_mb} MB memory
                  </span>
                </div>
              </div>
              <div className="problem-row-status">
                {p.user_status && (
                  <Badge tone={statusTone(p.user_status)}>
                    {p.user_status.replace("_", " ")}
                  </Badge>
                )}
                {canWork ? (
                  <Link to={`/problems/${p.id}`} className="icon-btn">
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <span className="locked-label">
                    <LockKeyhole size={15} />
                    {group.status === "UPCOMING" ? "Belum dibuka" : "Selesai"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada soal"
          description="Admin belum menambahkan soal ke problem group ini."
        />
      )}
    </>
  );
}
function Code2Icon() {
  return <BookOpen size={40} />;
}
