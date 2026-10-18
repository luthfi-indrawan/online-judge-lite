import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Papa from "papaparse";
import {
  Download,
  FileSpreadsheet,
  KeyRound,
  Plus,
  Search,
  Upload,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { api, getErrorMessage, request } from "../lib/api";
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
} from "../components/UI";
import type { User } from "../types";
export default function AdminUsers() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState<"create" | "bulk" | "reset" | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<
    { username: string; name: string; password: string; role: "USER" }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);
  async function loadUsers() {
    setUsersLoading(true);
    try {
      const data = await request<User[]>(api.get("/admin/users"));
      setUsers(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUsersLoading(false);
    }
  }
  // Load list when the page mounts.
  useEffect(() => {
    void loadUsers();
  }, []);
  async function createUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await request<User>(
        api.post("/admin/users", {
          username: username.trim(),
          name: name.trim(),
          password,
          role: "USER",
        }),
      );
      setSuccess(`Akun ${username} berhasil dibuat.`);
      setUsername("");
      setName("");
      setPassword("");
      setModal(null);
      await loadUsers();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .map((r) => ({
            username: (r.username || r.Username || "").trim(),
            name: (r.name || r.Name || r.nama || "").trim(),
            password: (r.password || r.Password || "").trim(),
            role: "USER" as const,
          }))
          .filter((r) => r.username && r.name && r.password);
        if (!rows.length) {
          setError(
            "CSV tidak memiliki baris valid. Kolom wajib: username, name, password.",
          );
          return;
        }
        setBulkUsers(rows);
        setModal("bulk");
      },
      error: (e) => setError(e.message),
    });
  }
  async function bulkCreate() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ created_count: number }>(
        api.post("/admin/users/bulk", { users: bulkUsers }),
      );
      setSuccess(`${result.created_count} akun berhasil dibuat.`);
      setBulkUsers([]);
      setModal(null);
      await loadUsers();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setBusy(true);
    setError("");
    try {
      await request<null>(
        api.put(`/admin/users/${resetUser.id}/reset-password`, {
          new_password: newPassword,
        }),
      );
      setSuccess(`Password ${resetUser.username} berhasil diperbarui.`);
      setNewPassword("");
      setResetUser(null);
      setModal(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const visible = users.filter((u) =>
    `${u.name} ${u.username}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Manajemen user"
        description="Buat akun peserta, impor daftar dari CSV, dan reset password."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> Import CSV
            </Button>
            <Button onClick={() => setModal("create")}>
              <Plus size={16} /> Tambah user
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                void importFile(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
          </>
        }
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && (
        <Alert kind="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <div className="admin-stat-row">
        <div className="admin-stat-card">
          <div className="stat-icon stat-blue">
            <UsersRound size={19} />
          </div>
          <div>
            <span>Total akun ditampilkan</span>
            <strong>{users.length}</strong>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon stat-green">
            <UserPlus size={19} />
          </div>
          <div>
            <span>Akun peserta</span>
            <strong>{users.filter((u) => u.role === "USER").length}</strong>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon stat-purple">
            <KeyRound size={19} />
          </div>
          <div>
            <span>Role administrator</span>
            <strong>{users.filter((u) => u.role === "ADMIN").length}</strong>
          </div>
        </div>
      </div>
      <section className="panel admin-table-panel">
        <div className="panel-header">
          <div>
            <h2>Semua akun</h2>
            <p>Daftar user yang terdaftar pada platform.</p>
          </div>
          <div className="search-wrap admin-search">
            <Search size={16} />
            <Input
              placeholder="Cari nama atau username"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {usersLoading ? (
          <Loading />
        ) : visible.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Terdaftar</th>
                  <th className="actions-col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {u.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          <span>ID #{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="inline-code">{u.username}</code>
                    </td>
                    <td>
                      <Badge tone={u.role === "ADMIN" ? "purple" : "blue"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setResetUser(u);
                          setModal("reset");
                        }}
                      >
                        <KeyRound size={14} /> Reset password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Tidak ada akun"
            description={
              search
                ? "Tidak ada akun yang cocok dengan pencarian."
                : "Buat akun pertama untuk mulai mengelola peserta."
            }
            action={
              <Button onClick={() => setModal("create")}>
                <Plus size={15} /> Tambah user
              </Button>
            }
          />
        )}
      </section>
      <div className="admin-info-note">
        <FileSpreadsheet size={18} />
        <div>
          <strong>Format CSV yang didukung</strong>
          <p>
            Gunakan header <code>username,name,password</code>. Semua baris akan
            diproses sebagai role USER. Jika satu username duplikat, backend
            dapat membatalkan seluruh transaksi bulk.
          </p>
          <button
            className="text-link button-link"
            onClick={() => {
              const csv =
                "username,name,password\nmhs_001,Ahmad Yani,Password123!\nmhs_002,Siti Aminah,Password123!";
              const url = URL.createObjectURL(
                new Blob([csv], { type: "text/csv" }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "oj-lite-users-template.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={14} /> Download template CSV
          </button>
        </div>
      </div>
      {modal === "create" && (
        <Modal title="Tambah user baru" onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={createUser}>
            <p className="modal-description">
              Buat akun peserta. Kredensial akan digunakan untuk login pertama
              kali.
            </p>
            <Field label="Nama lengkap">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Contoh: Ahmad Yani"
              />
            </Field>
            <Field label="Username">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={50}
                placeholder="Contoh: mhs_001"
              />
            </Field>
            <Field label="Password awal">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
              />
            </Field>
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
                {busy ? "Menyimpan..." : "Buat akun"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "bulk" && (
        <Modal
          title="Konfirmasi import CSV"
          onClose={() => setModal(null)}
          wide
        >
          <div className="modal-form">
            <p className="modal-description">
              Ditemukan {bulkUsers.length} baris valid. Periksa data sebelum
              mengirimkannya ke backend.
            </p>
            <div className="bulk-preview">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nama</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkUsers.slice(0, 8).map((u, i) => (
                    <tr key={i}>
                      <td>{u.username}</td>
                      <td>{u.name}</td>
                      <td>••••••••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bulkUsers.length > 8 && (
                <div className="bulk-more">
                  dan {bulkUsers.length - 8} baris lainnya
                </div>
              )}
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button onClick={bulkCreate} disabled={busy}>
                {busy ? "Mengimpor..." : `Import ${bulkUsers.length} akun`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === "reset" && resetUser && (
        <Modal title="Reset password" onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={resetPassword}>
            <p className="modal-description">
              Password baru untuk <strong>{resetUser.name}</strong> (
              <code>{resetUser.username}</code>).
            </p>
            <Field label="Password baru">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                autoFocus
              />
            </Field>
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
                {busy ? "Memperbarui..." : "Reset password"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
