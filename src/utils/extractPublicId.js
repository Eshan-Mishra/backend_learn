function extractPublicId(Url) {
  const regex = /upload\/v\d+\/(.+?)\.(?:jpg|jpeg|png|webp|gif|bmp|tiff)$/i;
  const match = Url.match(regex);
  return match ? match[1] : null;
}

export { extractPublicId };
