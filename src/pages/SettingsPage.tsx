import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ShortcutRecorder } from "@/components/settings/ShortcutRecorder";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";
import { isElectron } from "@/lib/utils";
import { ShieldCheck, Sparkles, Scale, CheckCircle2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-[13px] font-medium text-[color:var(--text-primary)]">{title}</p>
        {description && <p className="mt-0.5 text-[12px] text-tertiary">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();
  const [version, setVersion] = useState(__APP_VERSION__);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (isElectron()) void window.colorflow.app.getVersion().then(setVersion);
  }, []);

  const handleCheckUpdates = async () => {
    if (!isElectron()) return;
    setCheckingUpdate(true);
    try {
      const result = await window.colorflow.updater.check();
      if (result.status === "upToDate") {
        notify(t.updater.upToDate, "success");
      } else if (result.status === "available") {
        notify(`Mise à jour v${result.info.version} disponible !`, "info");
      } else if (result.status === "error") {
        notify(result.message, "warning");
      }
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-16 select-none w-full">
      <div>
        <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t.settings.title}</h2>
        <p className="text-xs text-secondary mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Picker Settings */}
      <GlassCard className="p-5">
        <h3 className="mb-2 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.picker}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.globalShortcut}
            description={t.settings.globalShortcutDesc}
            control={
              <ShortcutRecorder
                value={settings.pickerShortcut}
                onChange={(accelerator) => {
                  void updateSettings({ pickerShortcut: accelerator });
                  notify(t.settings.shortcutUpdated, "success", accelerator);
                }}
              />
            }
          />
          <SettingRow
            title={t.settings.magnifierZoom}
            description={t.settings.magnifierZoomDesc}
            control={
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={16}
                  step={1}
                  value={settings.magnifierZoom}
                  onChange={(e) => void updateSettings({ magnifierZoom: Number(e.target.value) })}
                  className="w-32 accent-[#0A84FF] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[color:var(--text-primary)] w-7 text-right">
                  {settings.magnifierZoom}x
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void updateSettings({ magnifierZoom: 8 });
                    notify("Zoom réinitialisé à 8x", "info");
                  }}
                  title="Réinitialiser à 8x"
                  className="apple-inner-box flex h-7 items-center gap-1.5 px-2.5 text-[11px] font-semibold text-secondary hover:text-[color:var(--text-primary)] transition rounded-lg cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            }
          />
        </div>
      </GlassCard>

      {/* Behavior Settings */}
      <GlassCard className="p-5">
        <h3 className="mb-2 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.behavior}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.launchAtStartup}
            description={t.settings.launchAtStartupDesc}
            control={
              <Switch
                checked={settings.launchAtStartup}
                onCheckedChange={(checked) => void updateSettings({ launchAtStartup: checked })}
                disabled={!isElectron()}
              />
            }
          />
          <SettingRow
            title={t.settings.closeToTray}
            description={t.settings.closeToTrayDesc}
            control={
              <Switch
                checked={settings.closeToTray}
                onCheckedChange={(checked) => void updateSettings({ closeToTray: checked })}
              />
            }
          />
        </div>
      </GlassCard>

      {/* Appearance Settings */}
      <GlassCard className="p-5">
        <h3 className="mb-2 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.appearance}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.theme}
            control={
              <Select
                value={settings.theme}
                onValueChange={(v) => void updateSettings({ theme: v as typeof settings.theme })}
                options={[
                  { value: "dark", label: t.settings.themeDark },
                  { value: "light", label: t.settings.themeLight },
                  { value: "system", label: t.settings.themeSystem },
                ]}
              />
            }
          />
          <SettingRow
            title={t.settings.animations}
            description={t.settings.animationsDesc}
            control={
              <Switch
                checked={settings.animationsEnabled}
                onCheckedChange={(checked) => void updateSettings({ animationsEnabled: checked })}
              />
            }
          />
        </div>
      </GlassCard>

      {/* General Settings */}
      <GlassCard className="p-5">
        <h3 className="mb-2 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.settings.general}</h3>
        <div className="divide-y divide-[color:var(--panel-border)]">
          <SettingRow
            title={t.settings.defaultCopyFormat}
            control={
              <Select
                value={settings.defaultCopyFormat}
                onValueChange={(v) =>
                  void updateSettings({ defaultCopyFormat: v as typeof settings.defaultCopyFormat })
                }
                options={[
                  { value: "hex", label: "HEX (#RRGGBB)" },
                  { value: "rgb", label: "RGB" },
                  { value: "rgba", label: "RGBA" },
                  { value: "hsl", label: "HSL" },
                  { value: "hsv", label: "HSV" },
                  { value: "cmyk", label: "CMYK" },
                  { value: "lab", label: "LAB" },
                  { value: "oklch", label: "OKLCH" },
                ]}
              />
            }
          />
          <SettingRow
            title={t.settings.language}
            control={
              <Select
                value={settings.language}
                onValueChange={(v) => void updateSettings({ language: v as typeof settings.language })}
                options={[
                  { value: "fr", label: "Français" },
                  { value: "en", label: "English" },
                ]}
              />
            }
          />
        </div>
      </GlassCard>

      {/* GitHub Recommended License Section */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-[13px] font-bold text-[color:var(--text-primary)]">
              {t.settings.legal}
            </h3>
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2.5 py-0.5 rounded-md">
            GitHub Repository License
          </span>
        </div>

        <div className="space-y-3">
          {/* Main License Pill Card */}
          <div className="apple-inner-box p-4 space-y-2 rounded-xl border border-[#0A84FF]/25 bg-[#0A84FF]/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0A84FF]" />
                <span className="text-xs font-bold text-[color:var(--text-primary)] font-mono">
                  {t.settings.licenseName}
                </span>
              </div>
              <span className="text-[10.5px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {t.settings.licenseBadge}
              </span>
            </div>

            <p className="text-[11.5px] text-secondary font-medium pt-1">
              {t.settings.recommendedLicense} :
            </p>

            <ul className="space-y-1.5 pt-1 text-[11.5px] text-tertiary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.settings.licenseBullet1}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.settings.licenseBullet2}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.settings.licenseBullet3}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.settings.licenseBullet4}</span>
              </li>
            </ul>
          </div>

          {/* Third Party Credits */}
          <div className="apple-inner-box p-3.5 space-y-1 rounded-xl">
            <div className="flex items-center gap-2 text-[color:var(--text-primary)] font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>{t.settings.creditsTitle}</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-tertiary pl-1 pt-1">
              <li>{t.settings.creditsAutoEq}</li>
              <li>{t.settings.creditsApo}</li>
              <li>{t.settings.creditsIcons}</li>
              <li>
                <a
                  href="https://github.com/luoxthedev/color-picker"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0A84FF] hover:underline"
                >
                  {t.settings.creditsLuox}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Software Updates */}
      {isElectron() && (
        <GlassCard className="p-5">
          <h3 className="mb-2 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.updater.updates}</h3>
          <div className="divide-y divide-[color:var(--panel-border)]">
            <SettingRow
              title={t.updater.currentVersion}
              description={`v${version}`}
              control={
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={checkingUpdate}
                  onClick={() => void handleCheckUpdates()}
                >
                  {checkingUpdate ? t.updater.checkingManual : t.updater.checkForUpdates}
                </Button>
              }
            />
          </div>
        </GlassCard>
      )}
    </div>
  );
}
