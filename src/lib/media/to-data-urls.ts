import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Chat attachments go over the coder websocket as `data:` URLs. The picker
 * hands back `file://` URIs that only exist on this phone; the server can
 * neither show them to the model nor save them into the project (a logo from
 * "Customise with AI" would never arrive). Each one is resized to at most
 * MAX px on its long side and encoded: PNG keeps a logo's transparency.
 * Anything already a data:/http(s) URL passes through; a file that cannot be
 * read is dropped rather than failing the send.
 */
const MAX = 1024;

async function one(uri: string): Promise<string | null> {
  if (/^(data:|https?:)/i.test(uri)) return uri;
  try {
    const probe = await manipulateAsync(uri, []);
    const long = Math.max(probe.width, probe.height);
    const resize =
      long > MAX
        ? [
            {
              resize:
                probe.width >= probe.height ? { width: MAX } : { height: MAX },
            },
          ]
        : [];
    const out = await manipulateAsync(uri, resize, {
      format: SaveFormat.PNG,
      base64: true,
    });
    return out.base64 ? `data:image/png;base64,${out.base64}` : null;
  } catch {
    return null;
  }
}

export async function toDataUrls(
  uris?: string[]
): Promise<string[] | undefined> {
  if (!uris?.length) return undefined;
  const out = (await Promise.all(uris.map(one))).filter(
    (u): u is string => !!u
  );
  return out.length ? out : undefined;
}
