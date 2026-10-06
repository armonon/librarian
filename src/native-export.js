import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function nativeExport(blob, name) {
  if (!Capacitor.isNativePlatform()) return false;
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  const path = `exports/${Date.now()}-${name.replace(/[^\p{L}\p{N}._ -]/gu, '_')}`;
  const { uri } = await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true });
  try { await Share.share({ title: name, url: uri, dialogTitle: 'Save or share your book' }); }
  finally { await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {}); }
  return true;
}
