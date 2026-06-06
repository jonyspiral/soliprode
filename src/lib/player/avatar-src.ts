export function buildProxyAvatarSrc(imageUrl: string) {
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("/")) {
    return imageUrl;
  }

  const searchParams = new URLSearchParams({ src: imageUrl });
  return `/api/avatar?${searchParams.toString()}`;
}
