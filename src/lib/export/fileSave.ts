import { isElectron } from "@/lib/utils";

interface FileFilter {
  name: string;
  extensions: string[];
}

function downloadInBrowser(defaultName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = defaultName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function saveTextFile(
  defaultName: string,
  content: string,
  filters: FileFilter[],
): Promise<boolean> {
  if (isElectron()) {
    const result = await window.colorflow.export.saveFile({ defaultName, content, filters });
    return result.success;
  }
  downloadInBrowser(defaultName, new Blob([content], { type: "text/plain" }));
  return true;
}

export async function savePngFile(defaultName: string, dataUrl: string): Promise<boolean> {
  if (isElectron()) {
    const result = await window.colorflow.export.savePng({ defaultName, dataUrl });
    return result.success;
  }
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadInBrowser(defaultName, blob);
  return true;
}
