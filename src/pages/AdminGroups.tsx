import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarClock, Edit3, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getErrorMessage, request } from "../lib/api";
import {
  formatDate,
  groupStatusLabel,
  localInputToISO,
  toLocalInput,
} from "../lib/utils";
import type { ProblemGroup } from "../types";
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
  Textarea,
} from "../components/UI";
export default function AdminGroups() {
  const [groups, setGroups] = useState<ProblemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  async function load() {
    setLoading(true);
    try {
      setGroups(await request<ProblemGroup[]>(api.get("/problem-groups")));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (new Date(end) <= new Date(start)) {
      setError("Waktu selesai harus setelah waktu mulai.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request<ProblemGroup>(
        api.post("/problem-groups", {
          title: title.trim(),
          description: description.trim(),
          start_time: localInputToISO(start),
          end_time: localInputToISO(end),
        }),
      );
      setSuccess("Problem group berhasil dibuat.");
      setModal(false);
      setTitle("");
      setDescription("");
      setStart("");
      setEnd("");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const visible = groups.filter((g) =>
    `${g.title} ${g.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="SESSION MANAGEMENT"
        title="Problem groups"
        description="Atur jadwal contest atau sesi praktikum dan kelola soal di dalamnya."
        actions={
          <Button
            onClick={() => {
              setError("");
              setModal(true);
            }}
          >
            <Plus size={16} /> Buat problem group
          </Button>
        }
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert kind="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <div className="toolbar toolbar-single">
        <div className="search-wrap">
          <Search size={17} />
          <Input
            placeholder="Cari judul atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-count">{groups.length} problem groups</div>
      </div>
      <section className="panel admin-table-panel">
        {loading ? (
          <Loading />
        ) : visible.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Problem group</th>
                  <th>Jadwal mulai</th>
                  <th>Jadwal selesai</th>
                  <th>Soal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="group-table-cell">
                        <div className="group-symbol symbol-upcoming">
                          <CalendarClock size={17} />
                        </div>
                        <div>
                          <strong>{g.title}</strong>
                          <span>{g.description || "Tanpa deskripsi"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(g.start_time)}</td>
                    <td>{formatDate(g.end_time)}</td>
                    <td>
                      <span className="problem-count">
                        {g.total_problems ?? 0}
                      </span>
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <Link
                        className="table-action-link"
                        to={`/groups/${g.id}`}
                      >
                        <Edit3 size={14} /> Kelola soal
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada problem group"
            description="Buat sesi pertama dan atur waktu mulai serta selesai."
            action={
              <Button onClick={() => setModal(true)}>
                <Plus size={15} /> Buat problem group
              </Button>
            }
          />
        )}
      </section>
      {modal && (
        <Modal title="Buat problem group" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={create}>
            <p className="modal-description">
              Jadwal akan divalidasi oleh backend dan menjadi acuan akses
              submission peserta.
            </p>
            <Field label="Judul sesi">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
                placeholder="Contoh: Praktikum Algoritma Minggu 1"
              />
            </Field>
            <Field label="Deskripsi">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Topik dan instruksi singkat sesi"
              />
            </Field>
            <Field label="Waktu mulai">
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </Field>
            <Field label="Waktu selesai">
              <Input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                min={start || undefined}
              />
            </Field>
            {error && <Alert>{error}</Alert>}
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Menyimpan..." : "Buat sesi"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
