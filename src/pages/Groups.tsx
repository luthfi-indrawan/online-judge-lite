import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CalendarClock, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import { formatDate, groupStatusLabel } from "../lib/utils";
import type { ProblemGroup } from "../types";
import {
  Alert,
  Badge,
  EmptyState,
  Input,
  Loading,
  PageHeader,
} from "../components/UI";
export default function Groups() {
  const [groups, setGroups] = useState<ProblemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  useEffect(() => {
    request<ProblemGroup[]>(api.get("/problem-groups"))
      .then(setGroups)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(
    () =>
      groups.filter(
        (g) =>
          (filter === "ALL" || g.status === filter) &&
          `${g.title} ${g.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [groups, filter, search],
  );
  return (
    <>
      <PageHeader
        eyebrow="PRACTICE & CONTESTS"
        title="Problem groups"
        description="Pilih sesi yang ingin kamu ikuti. Status dan jadwal mengikuti waktu server."
      />
      {error && <Alert>{error}</Alert>}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={17} />
          <Input
            placeholder="Cari problem group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {[
            ["ALL", "Semua"],
            ["ONGOING", "Berlangsung"],
            ["UPCOMING", "Akan datang"],
            ["ENDED", "Selesai"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab ${filter === v ? "selected" : ""}`}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        <div className="groups-grid">
          {filtered.map((g) => (
            <Link className="group-card" to={`/groups/${g.id}`} key={g.id}>
              <div className="group-card-top">
                <div
                  className={`group-symbol ${g.status === "ONGOING" ? "symbol-live" : g.status === "ENDED" ? "symbol-ended" : "symbol-upcoming"}`}
                >
                  <BookOpen size={20} />
                </div>
                <Badge
                  tone={
                    g.status === "ONGOING"
                      ? "green"
                      : g.status === "UPCOMING"
                        ? "blue"
                        : "neutral"
                  }
                >
                  {groupStatusLabel(g.status)}
                </Badge>
              </div>
              <h2>{g.title}</h2>
              <p>{g.description || "Belum ada deskripsi untuk sesi ini."}</p>
              <div className="group-card-meta">
                <span>
                  <CalendarClock size={14} />{" "}
                  {g.status === "ENDED"
                    ? "Berakhir"
                    : g.status === "UPCOMING"
                      ? "Mulai"
                      : "Tutup"}{" "}
                  {formatDate(
                    g.status === "ENDED"
                      ? g.end_time
                      : g.status === "UPCOMING"
                        ? g.start_time
                        : g.end_time,
                  )}
                </span>
                <span>
                  <BookOpen size={14} /> {g.total_problems ?? 0} soal
                </span>
              </div>
              <div className="group-card-footer">
                <span>
                  {g.status === "ONGOING"
                    ? "Sesi sedang aktif"
                    : g.status === "UPCOMING"
                      ? "Persiapkan dirimu"
                      : "Lihat ringkasan sesi"}
                </span>
                <ArrowRight size={17} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Tidak ada problem group"
          description={
            search
              ? "Coba kata kunci lain atau ubah filter."
              : "Belum ada sesi untuk ditampilkan."
          }
        />
      )}
    </>
  );
}
