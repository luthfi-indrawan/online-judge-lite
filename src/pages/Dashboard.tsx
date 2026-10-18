import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  Medal,
  Plus,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatRelative, groupStatusLabel } from "../lib/utils";
import type { ProblemGroup, Scoreboard, Submission } from "../types";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Loading,
  PageHeader,
} from "../components/UI";
export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ProblemGroup[]>([]);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await request<ProblemGroup[]>(api.get("/problem-groups"));
        if (active) setGroups(data);
      } catch (e) {
        if (active) setError(getErrorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (user?.role !== "USER") return;
    let active = true;
    (async () => {
      try {
        const data = await request<Submission[]>(api.get("/submissions/me"));
        if (active) setSubmissions(data.slice(0, 5));
      } catch {
        /* Endpoint is optional in API contract; dashboard remains usable. */
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.role]);
  const stats = useMemo(
    () => ({
      active: groups.filter((g) => g.status === "ONGOING").length,
      upcoming: groups.filter((g) => g.status === "UPCOMING").length,
      ended: groups.filter((g) => g.status === "ENDED").length,
    }),
    [groups],
  );
  const upcoming = groups.filter((g) => g.status !== "ENDED").slice(0, 4);
  return (
    <>
      <PageHeader
        eyebrow={user?.role === "ADMIN" ? "ADMIN CONSOLE" : "YOUR WORKSPACE"}
        title={`Halo, ${user?.name?.split(" ")[0] || "User"}.`}
        description={
          user?.role === "ADMIN"
            ? "Kelola sesi, peserta, dan soal dari satu tempat."
            : "Siap untuk tantangan algoritma berikutnya? Lanjutkan progresmu di sini."
        }
        actions={
          user?.role === "ADMIN" ? (
            <Link to="/admin/groups">
              <Button>
                <Plus size={16} /> Buat problem group
              </Button>
            </Link>
          ) : (
            <Link to="/groups">
              <Button>
                Lihat semua soal <ArrowRight size={16} />
              </Button>
            </Link>
          )
        }
      />
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="welcome-banner">
            <div className="welcome-copy">
              <div className="welcome-label">
                <Sparkles size={15} />{" "}
                {user?.role === "ADMIN"
                  ? "ADMINISTRATOR SPACE"
                  : "KEEP LEARNING"}
              </div>
              <h2>
                {user?.role === "ADMIN"
                  ? "Semua sesi, satu kendali."
                  : "Small steps. Better solutions."}
              </h2>
              <p>
                {user?.role === "ADMIN"
                  ? "Pastikan jadwal, peserta, dan test case siap sebelum sesi dimulai."
                  : "Pahami problemnya, susun algoritmanya, lalu buktikan lewat submission."}
              </p>
            </div>
            <div className="welcome-art">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-code">
                <span>01</span>
                <Code2 size={33} />
                <span>AC</span>
              </div>
              <div className="art-pill art-pill-top">C++ 17</div>
              <div className="art-pill art-pill-bottom">
                <CheckCircle2 size={13} /> Accepted
              </div>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-blue">
                <BookOpen size={19} />
              </div>
              <div className="stat-label">Total problem groups</div>
              <div className="stat-value">
                {groups.length}
                <span className="stat-suffix">groups</span>
              </div>
              <div className="stat-foot">Semua sesi terdaftar</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-green">
                <Target size={19} />
              </div>
              <div className="stat-label">Sedang berlangsung</div>
              <div className="stat-value">
                {stats.active}
                <span className="stat-suffix">aktif</span>
              </div>
              <div className="stat-foot">Bisa dikerjakan sekarang</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-purple">
                <Clock3 size={19} />
              </div>
              <div className="stat-label">Akan datang</div>
              <div className="stat-value">
                {stats.upcoming}
                <span className="stat-suffix">sesi</span>
              </div>
              <div className="stat-foot">Persiapkan dirimu</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-amber">
                {user?.role === "ADMIN" ? (
                  <UsersRound size={19} />
                ) : (
                  <Medal size={19} />
                )}
              </div>
              <div className="stat-label">
                {user?.role === "ADMIN" ? "Sesi selesai" : "Submission terbaru"}
              </div>
              <div className="stat-value">
                {user?.role === "ADMIN" ? stats.ended : submissions.length}
                <span className="stat-suffix">
                  {user?.role === "ADMIN" ? "sesi" : "tercatat"}
                </span>
              </div>
              <div className="stat-foot">
                {user?.role === "ADMIN"
                  ? "Arsip problem group"
                  : "Submission terakhir"}
              </div>
            </div>
          </div>
          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Problem groups</h2>
                  <p>Sesi yang aktif dan akan datang</p>
                </div>
                <Link
                  to={user?.role === "ADMIN" ? "/admin/groups" : "/groups"}
                  className="text-link"
                >
                  Lihat semua <ArrowUpRight size={15} />
                </Link>
              </div>
              {upcoming.length ? (
                <div className="group-list">
                  {upcoming.map((group) => (
                    <Link
                      to={`/groups/${group.id}`}
                      className="group-row"
                      key={group.id}
                    >
                      <div
                        className={`group-symbol ${group.status === "ONGOING" ? "symbol-live" : "symbol-upcoming"}`}
                      >
                        <BookOpen size={19} />
                      </div>
                      <div className="group-row-main">
                        <strong>{group.title}</strong>
                        <span>
                          {group.description || "Tidak ada deskripsi"}
                        </span>
                        <small>
                          <Clock3 size={13} />
                          {group.status === "ONGOING"
                            ? `Berakhir ${formatRelative(group.end_time)}`
                            : `Mulai ${formatDate(group.start_time)}`}
                        </small>
                      </div>
                      <div className="group-row-side">
                        <Badge
                          tone={group.status === "ONGOING" ? "green" : "blue"}
                        >
                          {groupStatusLabel(group.status)}
                        </Badge>
                        <span>{group.total_problems ?? "—"} soal</span>
                      </div>
                      <ArrowRight className="row-arrow" size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Belum ada problem group"
                  description="Problem group akan muncul di sini setelah tersedia."
                />
              )}
            </section>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {user?.role === "ADMIN"
                      ? "Quick actions"
                      : "Aktivitas terbaru"}
                  </h2>
                  <p>
                    {user?.role === "ADMIN"
                      ? "Akses cepat untuk administrasi"
                      : "Ringkasan submission kamu"}
                  </p>
                </div>
              </div>
              {user?.role === "ADMIN" ? (
                <div className="quick-actions">
                  <Link to="/admin/users" className="quick-action">
                    <div className="quick-icon quick-purple">
                      <UsersRound size={18} />
                    </div>
                    <div>
                      <strong>Kelola peserta</strong>
                      <span>Buat akun dan reset password</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/admin/groups" className="quick-action">
                    <div className="quick-icon quick-blue">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <strong>Atur problem group</strong>
                      <span>Buat sesi dan jadwal pengerjaan</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/admin/problems" className="quick-action">
                    <div className="quick-icon quick-green">
                      <Code2 size={18} />
                    </div>
                    <div>
                      <strong>Kelola soal</strong>
                      <span>PDF, limit, dan test case</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : submissions.length ? (
                <div className="activity-list">
                  {submissions.map((s) => (
                    <div className="activity-row" key={s.id}>
                      <div
                        className={`activity-mark verdict-${s.verdict.toLowerCase()}`}
                      >
                        <Code2 size={16} />
                      </div>
                      <div>
                        <strong>Submission #{s.id}</strong>
                        <span>
                          Problem #{s.problem_id} · {s.language.toUpperCase()}
                        </span>
                      </div>
                      <Badge
                        tone={
                          s.verdict === "AC"
                            ? "green"
                            : ["WA", "CE", "TLE", "RTE"].includes(s.verdict)
                              ? "red"
                              : "amber"
                        }
                      >
                        {s.verdict}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Mulai perjalananmu"
                  description="Kirim submission pertamamu dan aktivitasnya akan tampil di sini."
                  action={
                    <Link to="/groups">
                      <Button variant="secondary" size="sm">
                        Cari soal
                      </Button>
                    </Link>
                  }
                />
              )}
            </section>
          </div>
          <div className="bottom-tip">
            <div className="tip-icon">
              <Code2 size={18} />
            </div>
            <div>
              <strong>Tip of the day</strong>
              <p>
                Pastikan output program sesuai format yang diminta. Spasi dan
                newline juga bisa menentukan verdict.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
