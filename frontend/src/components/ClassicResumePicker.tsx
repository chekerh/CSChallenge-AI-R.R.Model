import { useEffect, useState } from 'react';
import { deleteResume, listResumes, type ResumeSummaryDto } from '../lib/api';

type Props = {
  token: string;
  selectedId: string | null;
  onSelect: (resumeId: string | null) => void;
  refreshKey: number;
  /** Bump after deletes so the list refetches. */
  onListInvalidated?: () => void;
};

export default function ClassicResumePicker({
  token,
  selectedId,
  onSelect,
  refreshKey,
  onListInvalidated,
}: Props) {
  const [items, setItems] = useState<ResumeSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      const r = await listResumes(token);
      if (cancelled) return;
      if ('error' in r) {
        setErr(r.error);
        setItems([]);
      } else {
        setItems(r);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const row = items.find((x) => String(x._id) === selectedId);
    if (row && row.version_count === 0) {
      onSelect(null);
    }
  }, [items, selectedId, onSelect]);

  const orphans = items.filter((x) => x.version_count === 0);

  async function handlePurgeOrphans() {
    if (!orphans.length) return;
    if (
      !window.confirm(
        `Supprimer ${orphans.length} CV sans contenu (0 version) ? Cette action est définitive.`
      )
    ) {
      return;
    }
    setPurging(true);
    setErr('');
    for (const row of orphans) {
      const r = await deleteResume(token, String(row._id));
      if ('error' in r) {
        setErr(r.error);
        setPurging(false);
        onListInvalidated?.();
        return;
      }
    }
    if (selectedId && orphans.some((o) => String(o._id) === selectedId)) {
      onSelect(null);
    }
    setPurging(false);
    onListInvalidated?.();
  }

  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
        Chargement de vos CV…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Impossible de charger la liste : {err}
      </div>
    );
  }

  function versionSuffix(row: ResumeSummaryDto): string {
    const n = row.version_count;
    if (n === undefined) return '';
    if (n === 0) return ' — 0 version (incomplet)';
    if (n === 1) return ' — 1 version';
    return ` — ${n} versions`;
  }

  function optionLabel(row: ResumeSummaryDto): string {
    const title = row.title?.trim() || 'Sans titre';
    const d = row.created_at
      ? new Date(row.created_at).toLocaleDateString('fr-FR')
      : '';
    let base = `${title}${d ? ` · ${d}` : ''}${versionSuffix(row)}`;
    const sameTitleCount = items.filter(
      (x) => (x.title?.trim() || 'Sans titre') === title
    ).length;
    if (sameTitleCount > 1) {
      const id = String(row._id);
      base = `${base} · #${id.slice(-6)}`;
    }
    return base;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800">Aucun CV enregistré</p>
        <p className="mt-1">
          Importez un fichier ou publiez depuis <strong>Créer mon CV</strong> pour
          alimenter cette liste.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Mes CV</h3>
        {loading ? (
          <span className="text-xs text-gray-500">Actualisation…</span>
        ) : null}
      </div>
      <label className="block text-xs font-medium text-gray-600">
        Ouvrir un CV existant
        <select
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          value={selectedId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onSelect(v ? v : null);
          }}
        >
          <option value="">— Choisir —</option>
          {items.map((row) => {
            const id = String(row._id);
            const empty = row.version_count === 0;
            return (
              <option key={id} value={id} disabled={empty}>
                {optionLabel(row)}
              </option>
            );
          })}
        </select>
      </label>
      {items.some((x) => x.version_count === 0) ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          Les CV marqués <strong>0 version</strong> sont des brouillons cassés : choisissez un autre
          document ou importez à nouveau.
        </p>
      ) : null}
      {orphans.length > 0 ? (
        <button
          type="button"
          disabled={purging || loading}
          onClick={handlePurgeOrphans}
          className="w-full text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-100 disabled:opacity-50"
        >
          {purging
            ? 'Suppression…'
            : `Supprimer ${orphans.length} CV sans contenu`}
        </button>
      ) : null}
    </div>
  );
}
