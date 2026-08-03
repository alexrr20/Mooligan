import type {
  CatalogProgress as CatalogProgressType,
  CatalogStatus as CatalogStatusType,
} from "../electron/catalog";
import type {
  CatalogCardSummary as CatalogCardSummaryType,
  CatalogListPage as CatalogListPageType,
  CatalogListRequest,
} from "../electron/catalog-query";

type CatalogApi = {
  download: () => Promise<CatalogStatusType>;
  list: (request?: CatalogListRequest) => Promise<CatalogListPageType>;
  onProgress: (callback: (progress: CatalogProgressType) => void) => () => void;
  status: () => Promise<CatalogStatusType>;
};

declare global {
  type CatalogProgress = CatalogProgressType;
  type CatalogStatus = CatalogStatusType;
  type CatalogCardSummary = CatalogCardSummaryType;

  interface Window {
    catalog?: CatalogApi;
  }
}
