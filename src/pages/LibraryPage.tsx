import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/state/appStore';
import { useClipboard } from '@/hooks/useClipboard';
import { Bookmark, History, Trash2, Download, Copy, Search } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const t = useI18n();
  const favorites = useAppStore((s) => s.favorites);
  const collections = useAppStore((s) => s.collections);
  const history = useAppStore((s) => s.history);
  const addCollection = useAppStore((s) => s.addCollection);
  const deleteCollection = useAppStore((s) => s.deleteCollection);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const removeHistoryEntry = useAppStore((s) => s.removeHistoryEntry);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();

  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim());
    setNewCollectionName('');
    notify('Dossier créé', 'success');
  };

  const filteredFavorites = favorites.filter((fav) => {
    const matchesCollection =
      selectedCollectionId === 'all' || fav.collectionId === selectedCollectionId;
    const matchesSearch =
      fav.hex.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollection && matchesSearch;
  });

  const filteredHistory = history.filter((entry) =>
    entry.hex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportFavoritesJson = () => {
    const data = JSON.stringify({ favorites, collections }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serenity-library-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Bibliothèque exportée en JSON', 'success');
  };

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
            {t.colorLibrary.title}
          </h2>
          <p className="text-xs text-secondary mt-1">
            {t.colorLibrary.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="apple-inner-box flex p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'favorites'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-secondary hover:text-[color:var(--text-primary)]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t.colorLibrary.favorites} ({favorites.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-secondary hover:text-[color:var(--text-primary)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t.colorLibrary.history} ({history.length})</span>
            </button>
          </div>

          <button
            onClick={exportFavoritesJson}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)] transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.colorLibrary.export}</span>
          </button>
        </div>
      </div>

      {activeTab === 'favorites' && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="apple-card flex flex-col gap-4 p-4">
            <span className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider px-1">
              Dossiers
            </span>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCollectionId('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  selectedCollectionId === 'all'
                    ? 'bg-[#0A84FF] text-white'
                    : 'text-secondary hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-primary)]'
                }`}
              >
                <span>{t.colorLibrary.allFavorites}</span>
                <span className="font-mono text-[11px] opacity-75">{favorites.length}</span>
              </button>

              {collections.map((col) => {
                const count = favorites.filter((f) => f.collectionId === col.id).length;
                const isSelected = selectedCollectionId === col.id;

                return (
                  <div
                    key={col.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A84FF] text-white'
                        : 'text-secondary hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-primary)]'
                    }`}
                    onClick={() => setSelectedCollectionId(col.id)}
                  >
                    <span className="truncate">{col.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] opacity-75">{count}</span>
                      {col.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleCreateCollection} className="pt-2 border-t border-[color:var(--card-border)] space-y-2">
              <input
                type="text"
                placeholder="{t.colorLibrary.newFolder}"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="apple-inner-box w-full px-3 py-1.5 text-xs text-[color:var(--text-primary)] focus-ring rounded-xl"
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim()}
                className="w-full py-1.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-40"
              >
                {t.colorLibrary.add}
              </button>
            </form>
          </div>

          <div className="apple-card flex flex-col gap-4 p-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary" />
              <input
                type="text"
                placeholder="{t.colorLibrary.filterHex}"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="apple-inner-box w-full pl-9 pr-3 py-1.5 text-xs text-[color:var(--text-primary)] focus-ring rounded-xl"
              />
            </div>

            {filteredFavorites.length === 0 ? (
              <p className="text-xs text-tertiary py-12 text-center">
                {t.colorLibrary.noFavorites}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredFavorites.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => {
                      setActiveColor(fav.hex, 'manual');
                      notify(`Couleur ${fav.hex.toUpperCase()} sélectionnée`, 'success');
                    }}
                    className="apple-inner-box group flex flex-col justify-between p-3 transition cursor-pointer space-y-2.5 hover:border-[color:var(--panel-border-strong)]"
                  >
                    <div
                      className="w-full h-16 rounded-lg border border-black/10 dark:border-white/15 shadow-sm"
                      style={{ backgroundColor: fav.hex }}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[color:var(--text-primary)] truncate">
                        {fav.hex.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void copy(fav.hex, fav.id, 'HEX');
                          }}
                          className="p-1 text-tertiary hover:text-[color:var(--text-primary)] transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(fav.id);
                          }}
                          className="p-1 text-tertiary hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="apple-card flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <span className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.colorLibrary.history} des prélèvements récents ({history.length})
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer l'historique</span>
              </button>
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-xs text-tertiary py-12 text-center">
              Aucun prélèvement enregistré dans l'historique.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveColor(item.hex, 'manual');
                    notify(`Couleur ${item.hex.toUpperCase()} sélectionnée`, 'success');
                  }}
                  className="apple-inner-box group flex flex-col items-center gap-2 p-2.5 transition cursor-pointer hover:border-[color:var(--panel-border-strong)]"
                >
                  <div
                    className="w-full h-12 rounded-lg border border-black/10 dark:border-white/15 shadow-sm"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="flex items-center justify-between w-full text-[11px]">
                    <span className="font-mono font-bold text-[color:var(--text-primary)]">
                      {item.hex.toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryEntry(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
