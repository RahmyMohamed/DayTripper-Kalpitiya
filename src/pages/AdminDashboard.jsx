import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import PlaceMapPicker, {
  KALPITIYA_CENTER,
} from "../components/PlaceMapPicker.jsx";

const emptyForm = {
  name: "",
  category: "Natural Landmark",
  distanceKm: "",
  description: "",
  openingHours: "",
  visitDurationMin: 45,
  entranceFee: "",
  tips: "",
  accessNotes: "",
  dressCode: "",
  photographyTips: "",
  latitude: KALPITIYA_CENTER[0],
  longitude: KALPITIYA_CENTER[1],
  photos: "",
};

function validateForm(f) {
  const errors = [];
  if (!f.name.trim()) errors.push("Name is required");
  if (f.distanceKm === "" || Number(f.distanceKm) < 0 || Number(f.distanceKm) > 25)
    errors.push("Distance must be between 0 and 25 km");
  if (f.description.trim().length < 20)
    errors.push("Description should be at least 20 characters");
  if (!f.openingHours.trim()) errors.push("Opening hours is required");
  if (Number(f.visitDurationMin) < 10 || Number(f.visitDurationMin) > 480)
    errors.push("Visit duration must be between 10 and 480 minutes");
  if (f.tips.trim().length < 10) errors.push("Tips are required (min 10 chars)");
  if (f.latitude === "" || Number(f.latitude) < 5.5 || Number(f.latitude) > 10)
    errors.push("Latitude must be between 5.5 and 10.0");
  if (f.longitude === "" || Number(f.longitude) < 79 || Number(f.longitude) > 82.5)
    errors.push("Longitude must be between 79.0 and 82.5");
  return errors;
}

export default function AdminDashboard() {
  const {
    isAdmin,
    adminPlaces,
    createPlace,
    updatePlace,
    softDeletePlace,
    restorePlace,
    bulkUpdate,
    catList,
    addCategory,
    removeCategory,
    logout,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState("places");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkCat, setBulkCat] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAdmin) return <Navigate to="/admin" replace />;

  const cats = catList;

  const activePlaces = adminPlaces.filter((p) => !p.isDeleted);
  const deletedPlaces = adminPlaces.filter((p) => p.isDeleted);

  const rowErrors = useMemo(() => {
    const map = {};
    adminPlaces.forEach((p) => {
      const errs = [];
      if (p.latitude == null || p.longitude == null) errs.push("missing coords");
      if (!p.photos || p.photos.length === 0) errs.push("no photo");
      map[p.id] = errs;
    });
    return map;
  }, [adminPlaces]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setCoords = (lat, lng) =>
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors([]);
  };

  const startEdit = (place) => {
    setEditingId(place.id);
    setForm({
      name: place.name,
      category: place.category,
      distanceKm: place.distanceKm,
      description: place.description,
      openingHours: place.openingHours,
      visitDurationMin: place.visitDurationMin,
      entranceFee: place.entranceFee || "",
      tips: place.tips,
      accessNotes: place.accessNotes || "",
      dressCode: place.dressCode || "",
      photographyTips: place.photographyTips || "",
      latitude: place.latitude,
      longitude: place.longitude,
      photos: (place.photos || [])[0] || "",
    });
    setErrors([]);
    setTab("form");
    setNotice("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      distanceKm: Number(form.distanceKm),
      description: form.description.trim(),
      openingHours: form.openingHours.trim(),
      visitDurationMin: Number(form.visitDurationMin),
      entranceFee: form.entranceFee.trim(),
      tips: form.tips.trim(),
      accessNotes: form.accessNotes.trim(),
      dressCode: form.dressCode.trim(),
      photographyTips: form.photographyTips.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      photos: form.photos.trim() ? [form.photos.trim()] : [],
    };
    setSaving(true);
    try {
      if (editingId) {
        await updatePlace(editingId, payload);
        setNotice(`“${payload.name}” updated.`);
      } else {
        await createPlace(payload);
        setNotice(`“${payload.name}” added to the catalogue.`);
      }
      resetForm();
      setTab("places");
    } catch (err) {
      setNotice(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
    setTimeout(() => setNotice(""), 4000);
  };

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    setSelected((prev) =>
      prev.length === activePlaces.length
        ? []
        : activePlaces.map((p) => p.id)
    );

  const applyBulk = async () => {
    if (selected.length === 0) {
      setNotice("Select at least one row first.");
      return;
    }
    if (!bulkCat) {
      setNotice("Choose a category for the bulk update.");
      return;
    }
    try {
      const res = await bulkUpdate(selected, { category: bulkCat });
      setNotice(
        res.invalidCount > 0
          ? `Updated ${res.successCount} place(s); ${res.invalidCount} failed.`
          : `Updated category for ${res.successCount} place(s).`
      );
      setSelected([]);
      setBulkCat("");
    } catch (err) {
      setNotice(err.message || "Bulk update failed.");
    }
    setTimeout(() => setNotice(""), 4000);
  };

  const renderPlacesTab = () => (
    <>
      <div className="admin-toolbar">
        <div className="admin-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setTab("form"); }}>
            + New place
          </button>
          <button className="btn btn-outline" onClick={() => setTab("categories")}>
            Manage categories
          </button>
          <button className="btn btn-outline" onClick={() => setTab("bin")}>
            Soft-delete bin ({deletedPlaces.length})
          </button>
        </div>

        <div className="bulk-bar">
          <span>
            {selected.length > 0
              ? `${selected.length} selected`
              : "Select rows to bulk update"}
          </span>
          <select
            value={bulkCat}
            onChange={(e) => setBulkCat(e.target.value)}
            aria-label="Bulk category"
          >
            <option value="">Set category…</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" onClick={applyBulk}>
            Apply
          </button>
        </div>
      </div>

      <div className="table-wrap glass">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    activePlaces.length > 0 &&
                    selected.length === activePlaces.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th>Name</th>
              <th>Category</th>
              <th>Distance</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activePlaces.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="cell-name">
                  <strong>{p.name}</strong>
                </td>
                <td>
                  <span className="tag">{p.category}</span>
                </td>
                <td>
                  <span className={Number(p.distanceKm) > 25 ? "badge-warn" : ""}>
                    {p.distanceKm} km
                  </span>
                </td>
                <td>{p.visitDurationMin} min</td>
                <td>
                  <span className={`status ${p.active ? "on" : "off"}`}>
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td>
                  {rowErrors[p.id]?.map((e) => (
                    <span key={e} className="flag">
                      {e}
                    </span>
                  ))}
                </td>
                <td className="cell-actions">
                  <button className="icon-btn" onClick={() => startEdit(p)} title="Edit">
                    ✎
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => setConfirmDelete(p)}
                    title="Soft delete"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderFormTab = () => (
    <div className="place-form glass">
      <h2>{editingId ? "Edit place" : "New place"}</h2>

      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((e) => (
            <p key={e}>⚠ {e}</p>
          ))}
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <label className="field full">
            <span>Name *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Kalpitiya Dutch Fort"
            />
          </label>

          <label className="field">
            <span>Category *</span>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Distance (km) *</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="25"
              value={form.distanceKm}
              onChange={(e) => set("distanceKm", e.target.value)}
              placeholder="0–25"
            />
          </label>

          <label className="field full">
            <span>Description * (min 20 chars)</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the attraction…"
            />
          </label>

          <label className="field">
            <span>Opening hours *</span>
            <input
              type="text"
              value={form.openingHours}
              onChange={(e) => set("openingHours", e.target.value)}
              placeholder="e.g. Daily 06:00–18:00"
            />
          </label>

          <label className="field">
            <span>Visit duration (min) *</span>
            <input
              type="number"
              min="10"
              max="480"
              value={form.visitDurationMin}
              onChange={(e) => set("visitDurationMin", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Entrance fee</span>
            <input
              type="text"
              value={form.entranceFee}
              onChange={(e) => set("entranceFee", e.target.value)}
              placeholder='e.g. "Free", "Paid on site"'
            />
          </label>

          <label className="field">
            <span>Tips *</span>
            <textarea
              rows={2}
              value={form.tips}
              onChange={(e) => set("tips", e.target.value)}
              placeholder="Parking, best time, cautions…"
            />
          </label>

          <label className="field">
            <span>Access notes</span>
            <textarea
              rows={2}
              value={form.accessNotes}
              onChange={(e) => set("accessNotes", e.target.value)}
              placeholder="Navy permission, etc."
            />
          </label>

          <label className="field">
            <span>Dress code</span>
            <input
              type="text"
              value={form.dressCode}
              onChange={(e) => set("dressCode", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Photography tips</span>
            <textarea
              rows={2}
              value={form.photographyTips}
              onChange={(e) => set("photographyTips", e.target.value)}
              placeholder="Golden hour notes"
            />
          </label>

          <label className="field full">
            <span>Location *</span>
            <PlaceMapPicker
              value={{ latitude: form.latitude, longitude: form.longitude }}
              onChange={setCoords}
            />
          </label>

          <label className="field full">
            <span>Photo URL</span>
            <input
              type="url"
              value={form.photos}
              onChange={(e) => set("photos", e.target.value)}
              placeholder="https://…"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create place"}
          </button>
          <button type="button" className="btn btn-outline" onClick={resetForm}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="cat-manager glass">
      <h2>Category manager</h2>
      <div className="add-category">
        <input
          type="text"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="New category name"
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={async () => {
            const name = newCat.trim();
            if (!name) return;
            if (cats.includes(name)) {
              setNotice("Category already exists.");
              return;
            }
            try {
              await addCategory(name);
              setNewCat("");
              setNotice(`Added category “${name}”.`);
            } catch (err) {
              setNotice(err.message || "Failed to add category.");
            }
            setTimeout(() => setNotice(""), 3000);
          }}
        >
          Add
        </button>
      </div>

      <ul className="cat-list">
        {cats.map((c) => {
          const inUse = adminPlaces.filter((p) => p.category === c).length;
          return (
            <li key={c} className="cat-row">
              <span className="tag">{c}</span>
              <span className="cat-count">{inUse} place(s)</span>
              <button
                className="icon-btn danger"
                disabled={inUse > 0}
                title={
                  inUse > 0
                    ? "Cannot delete: referenced by places"
                    : "Delete category"
                }
                onClick={async () => {
                  if (inUse > 0) {
                    setNotice(`“${c}” is referenced by places and cannot be deleted.`);
                    setTimeout(() => setNotice(""), 3000);
                    return;
                  }
                  try {
                    await removeCategory(c);
                    setNotice(`Deleted “${c}”.`);
                  } catch (err) {
                    setNotice(err.message || "Failed to delete category.");
                  }
                  setTimeout(() => setNotice(""), 3000);
                }}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const renderBinTab = () => (
    <div className="bin glass">
      <h2>Soft-delete bin</h2>
      {deletedPlaces.length === 0 ? (
        <p className="muted">The bin is empty.</p>
      ) : (
        <ul className="bin-list">
          {deletedPlaces.map((p) => (
            <li key={p.id} className="bin-row">
              {p.image ? (
                <img src={p.image} alt="" style={{width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px'}} />
              ) : (
                <span className="stop-emoji">{p.emoji}</span>
              )}
              <span className="bin-info">
                <strong>{p.name}</strong>
                <span className="stop-meta">{p.category}</span>
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  try {
                    await restorePlace(p.id);
                    setNotice(`“${p.name}” restored and published.`);
                  } catch (err) {
                    setNotice(err.message || "Restore failed.");
                  }
                  setTimeout(() => setNotice(""), 3000);
                }}
              >
                ♻ Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="page admin-dashboard">
      <div className="admin-head">
        <div>
          <h1>Admin dashboard</h1>
          <p>Manage the attraction catalogue, categories, and listings.</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          Logout
        </button>
      </div>

      {notice && <div className="notice">{notice}</div>}

      <div className="tabs">
        <button
          className={tab === "places" ? "active" : ""}
          onClick={() => setTab("places")}
        >
          Places ({activePlaces.length})
        </button>
        <button
          className={tab === "form" ? "active" : ""}
          onClick={() => {
            resetForm();
            setTab("form");
          }}
        >
          Add place
        </button>
        <button
          className={tab === "categories" ? "active" : ""}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
        <button
          className={tab === "bin" ? "active" : ""}
          onClick={() => setTab("bin")}
        >
          Bin
        </button>
      </div>

      {tab === "places" && renderPlacesTab()}
      {tab === "form" && renderFormTab()}
      {tab === "categories" && renderCategoriesTab()}
      {tab === "bin" && renderBinTab()}

      {confirmDelete && (
        <div className="modal">
          <div className="modal-card glass-deep">
            <h3>Soft-delete this place?</h3>
            <p>
              “{confirmDelete.name}” will be hidden from the public catalogue
              and map, but can be restored from the bin.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await softDeletePlace(confirmDelete.id);
                    setNotice(`“${confirmDelete.name}” soft-deleted.`);
                  } catch (err) {
                    setNotice(err.message || "Soft-delete failed.");
                  }
                  setConfirmDelete(null);
                  setTimeout(() => setNotice(""), 3000);
                }}
              >
                Confirm delete
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}