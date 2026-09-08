/** Keep the first search result when available, but do not block publication on images. */
export async function prepareAutomaticPublication<Photo, Image>(
  search: () => Promise<Photo[]>,
  importImage: (photo: Photo) => Promise<Image>,
  publish: (image: Image | null) => Promise<unknown>,
): Promise<{ image: Image | null; imageError: string | null }> {
  let image: Image | null = null;
  let imageError: string | null = null;

  try {
    const [photo] = await search();
    if (!photo) {
      imageError = "No Pexels image found for this job.";
    } else {
      image = await importImage(photo);
    }
  } catch (error) {
    image = null;
    imageError = error instanceof Error ? error.message : String(error);
  }

  await publish(image);
  return { image, imageError };
}
