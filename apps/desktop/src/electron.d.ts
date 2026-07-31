import type {
  CatalogProgress as CatalogProgressType,
  CatalogStatus as CatalogStatusType,
} from "../electron/catalog";

type CatalogApi = {
  download: () => Promise<CatalogStatusType>;
  onProgress: (callback: (progress: CatalogProgressType) => void) => () => void;
  status: () => Promise<CatalogStatusType>;
};

declare global {
  type CatalogProgress = CatalogProgressType;
  type CatalogStatus = CatalogStatusType;

  interface Window {
    catalog?: CatalogApi;
  }
}
