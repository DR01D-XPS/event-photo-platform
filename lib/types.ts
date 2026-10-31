export type ImageStatus = "pending" | "approved";

export type StoredImage = {
  id: string;
  userName: string;
  originalName: string;
  fileName: string;
  filePath: string;
  status: ImageStatus;
  uploadedAt: string;
};

export type PublicImage = {
  id: string;
  userName: string;
  originalName: string;
  url: string;
  status: ImageStatus;
  uploadedAt: string;
};
