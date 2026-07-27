type CatalogProgress = {
  completed: number;
  total: number;
};

type CatalogStatus =
  | { installed: false }
  | {
      cardCount: number;
      installed: true;
      updatedAt: string;
      version: string;
    };

type CatalogApi = {
  download: () => Promise<CatalogStatus>;
  onProgress: (callback: (progress: CatalogProgress) => void) => () => void;
  status: () => Promise<CatalogStatus>;
};

interface Window {
  catalog?: CatalogApi;
}
