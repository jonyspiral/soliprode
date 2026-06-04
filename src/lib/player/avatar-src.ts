export function buildProxyAvatarSrc(imageUrl: string) {
  const searchParams = new URLSearchParams({ src: imageUrl });
  return `/api/avatar?${searchParams.toString()}`;
}
