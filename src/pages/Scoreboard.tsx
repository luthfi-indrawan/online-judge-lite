import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Medal, RefreshCw, Search, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Loading,
  PageHeader,
} from "../components/UI";
import type { ProblemGroup, Scoreboard, ScoreStatus } from "../types";
import { formatDate } from "../lib/utils";
const colorClass: Record<ScoreStatus["color_code"], string> = {
  DARK_GREEN: "cell-first",
  LIGHT_GREEN: "cell-ac",
  RED: "cell-wrong",
  GRAY: "cell-none",
};
export default function ScoreboardPage() {
  const params = useParams();
  const [groups, setGroups] = useState<ProblemGroup[]>([]);
  const [groupId, setGroupId] = useState(params.groupId || "");
  const [board, setBoard] = useState<Scoreboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    request<ProblemGroup[]>(api.get("/problem-groups"))
      .then((data) => {
        setGroups(data);
        if (params.groupId) setGroupId(params.groupId);
        else if (data.length)
          setGroupId(
            String(data.find((g) => g.status === "ONGOING")?.id || data[0].id),
          );
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setGroupsLoading(false));
  }, [params.groupId]);
  useEffect(() => {
    if (!groupId) return;
    let alive = true;
    setLoading(true);
    request<Scoreboard>(api.get(`/scoreboards/groups/${groupId}`))
      .then((data) => {
        if (alive) setBoard(data);
      })
      .catch((e) => {
        if (alive) {
          setBoard(null);
          setError(getErrorMessage(e));
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [groupId, refreshKey]);
  const rankings = useMemo(
    () =>
      board?.rankings.filter((r) =>
        `${r.name} ${r.username}`.toLowerCase().includes(search.toLowerCase()),
      ) || [],
    [board, search],
  );
  const selected = groups.find((g) => String(g.id) === groupId);
  return (
    <>
      <PageHeader
        eyebrow="LIVE RANKINGS"
        title="Scoreboard"
        description="Pantau progres peserta dan status pengerjaan tiap soal."
        actions={
          <Button
            variant="secondary"
            onClick={() => setRefreshKey((v) => v + 1)}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </Button>
        }
      />
      {error && (
        <div className="inline-error">
          {error}
          <button onClick={() => setError("")}>Tutup</button>
        </div>
      )}
      <div className="scoreboard-controls">
        <div className="scoreboard-select">
          <label>Problem group</label>
          <select
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setError("");
            }}
            disabled={groupsLoading}
          >
            <option value="">Pilih problem group</option>
            {groups.map((g) => (
              <option value={g.id} key={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div className="scoreboard-session">
          <span className="status-dot" />
          <div>
            <strong>
              {board?.group_title || selected?.title || "Pilih sesi"}
            </strong>
            <span>
              {selected
                ? `${formatDate(selected.start_time)} — ${formatDate(selected.end_time)}`
                : "Scoreboard per problem group"}
            </span>
          </div>
        </div>
        <div className="search-wrap scoreboard-search">
          <Search size={17} />
          <Input
            placeholder="Cari peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading || groupsLoading ? (
        <Loading label="Mengambil scoreboard..." />
      ) : !board ? (
        <EmptyState
          title="Scoreboard belum tersedia"
          description="Pilih problem group lain atau coba refresh setelah ada data."
        />
      ) : (
        <>
          <div className="scoreboard-summary">
            <div className="score-summary-icon">
              <Trophy size={22} />
            </div>
            <div>
              <strong>{board.rankings.length} peserta</strong>
              <span>berpartisipasi dalam sesi ini</span>
            </div>
            <div className="score-summary-problems">
              <strong>{board.problems.length}</strong>
              <span>total soal</span>
            </div>
            <div className="score-summary-legend">
              <span>
                <i className="legend-dot legend-first" /> First blood
              </span>
              <span>
                <i className="legend-dot legend-ac" /> Accepted
              </span>
              <span>
                <i className="legend-dot legend-wrong" /> Attempted
              </span>
              <span>
                <i className="legend-dot legend-none" /> Not attempted
              </span>
            </div>
          </div>
          <div className="scoreboard-table-wrap">
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th className="rank-col">#</th>
                  <th>Peserta</th>
                  <th className="solved-col">
                    <span className="sort-label">
                      Solved <ArrowUpDown size={12} />
                    </span>
                  </th>
                  {board.problems.map((p, i) => (
                    <th className="problem-col" key={p.id}>
                      <span>{String.fromCharCode(65 + i)}</span>
                      <small title={p.title}>{p.title}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, index) => (
                  <tr
                    key={r.user_id}
                    className={index === 0 ? "leader-row" : ""}
                  >
                    <td className="rank-cell">
                      {r.rank === 1 ? (
                        <span className="rank-medal">
                          <Medal size={17} />
                        </span>
                      ) : (
                        String(r.rank).padStart(2, "0")
                      )}
                    </td>
                    <td>
                      <div className="contestant">
                        <div
                          className={`contestant-avatar ${r.rank === 1 ? "avatar-leader" : ""}`}
                        >
                          {r.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{r.name}</strong>
                          <span>@{r.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="solved-cell">
                      <strong>{r.total_solved}</strong>
                      <span>/{board.problems.length}</span>
                    </td>
                    {board.problems.map((p) => {
                      const st =
                        r.submissions_status[String(p.id)] ||
                        ({
                          verdict: "NOT_ATTEMPTED",
                          is_first_blood: false,
                          color_code: "GRAY",
                          attempt_count: 0,
                        } as ScoreStatus);
                      return (
                        <td className="problem-score-cell" key={p.id}>
                          <div
                            className={`score-cell ${colorClass[st.color_code]}`}
                            title={`${st.verdict} · ${st.attempt_count} attempt${st.attempt_count === 1 ? "" : "s"}`}
                          >
                            {st.color_code === "DARK_GREEN" ? (
                              <Trophy size={14} />
                            ) : st.color_code === "LIGHT_GREEN" ? (
                              "AC"
                            ) : st.color_code === "RED" ? (
                              st.attempt_count
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rankings.length && (
              <EmptyState
                title="Peserta tidak ditemukan"
                description="Coba kata kunci nama atau username yang lain."
              />
            )}
          </div>
          <div className="scoreboard-footnote">
            <span>
              Warna sel menunjukkan verdict terbaik peserta pada soal tersebut.
            </span>
            <span>Data dapat diperbarui melalui tombol refresh.</span>
          </div>
        </>
      )}
    </>
  );
}
