import { Button } from "@base-ui/react/button";
import * as stylex from "@stylexjs/stylex";

type SearchResultsProps = {
  cards: CatalogCardSummary[];
  error: string;
  grid: boolean;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  total: number | null;
};

export function SearchResults({
  cards,
  error,
  grid,
  hasMore,
  loading,
  onLoadMore,
  total,
}: SearchResultsProps) {
  if (error) {
    return (
      <div {...stylex.props(styles.message)} role="alert">
        <span {...stylex.props(styles.messageMark)} aria-hidden="true">
          !
        </span>
        <div>
          <strong {...stylex.props(styles.messageTitle)}>Index unavailable</strong>
          <p {...stylex.props(styles.messageCopy)}>{error}</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0 && !loading) {
    return (
      <div {...stylex.props(styles.message)}>
        <span {...stylex.props(styles.messageMark)} aria-hidden="true">
          0
        </span>
        <div>
          <strong {...stylex.props(styles.messageTitle)}>No matching cards</strong>
          <p {...stylex.props(styles.messageCopy)}>Try a card name or a three-letter set code.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!grid ? (
        <div {...stylex.props(styles.columnHead)} aria-hidden="true">
          <span>No.</span>
          <span>Image</span>
          <span>Card / Type</span>
          <span>Printing</span>
        </div>
      ) : null}
      <ol {...stylex.props(styles.cardList, grid && styles.cardGrid)} start={1}>
        {cards.map((card, index) => (
          <li {...stylex.props(styles.cardRow, grid && styles.cardTile)} key={card.id}>
            <span {...stylex.props(styles.rowNumber, grid && styles.tileNumber)}>
              {String(index + 1).padStart(3, "0")}
            </span>
            <div {...stylex.props(styles.cardImageFrame, grid && styles.tileImageFrame)}>
              {card.imageUrl ? (
                <img
                  {...stylex.props(styles.cardImage)}
                  alt={`${card.name}, ${card.setName ?? card.setCode} printing`}
                  decoding="async"
                  loading="lazy"
                  src={grid ? (card.gridImageUrl ?? card.imageUrl) : card.imageUrl}
                />
              ) : (
                <span {...stylex.props(styles.cardImageFallback)}>No art</span>
              )}
            </div>
            <div {...stylex.props(styles.cardIdentity, grid && styles.tileIdentity)}>
              <strong {...stylex.props(styles.cardName, grid && styles.tileName)}>
                {card.name}
              </strong>
              <span {...stylex.props(styles.typeLine)}>{card.typeLine ?? "Card"}</span>
            </div>
            <div {...stylex.props(styles.printing, grid && styles.tilePrinting)}>
              <span {...stylex.props(styles.setCode)}>{card.setCode}</span>
              <span {...stylex.props(styles.printingCopy)}>
                {card.setName ?? "Unknown set"} · #{card.collectorNumber}
                {card.rarity ? ` · ${card.rarity}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {hasMore ? (
        <Button
          {...stylex.props(styles.moreButton)}
          disabled={loading}
          type="button"
          onClick={onLoadMore}
        >
          <span>{loading ? "Reading…" : "Show 100 more"}</span>
          <span {...stylex.props(styles.moreCount)}>
            {cards.length.toLocaleString()}
            {total === null ? "+" : ` / ${total.toLocaleString()}`}
          </span>
        </Button>
      ) : null}
    </>
  );
}

const styles = stylex.create({
  columnHead: {
    minHeight: "34px",
    display: "grid",
    gridTemplateColumns: {
      default: "54px 62px minmax(0, 1fr) minmax(180px, 0.72fr)",
      "@media (max-width: 820px)": "42px 52px minmax(0, 1fr) 150px",
    },
    alignItems: "center",
    borderBottom: "1px solid #bbb9af",
    color: "#8a8b83",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "7px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  cardList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  cardGrid: {
    paddingBlock: "22px 30px",
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(auto-fill, minmax(164px, 1fr))",
      "@media (max-width: 820px)": "repeat(auto-fill, minmax(148px, 1fr))",
    },
    gap: "28px 18px",
    borderBottom: "1px solid #bbb9af",
  },
  cardRow: {
    minHeight: "88px",
    paddingBlock: "10px",
    display: "grid",
    gridTemplateColumns: {
      default: "54px 62px minmax(0, 1fr) minmax(180px, 0.72fr)",
      "@media (max-width: 820px)": "42px 52px minmax(0, 1fr) 150px",
    },
    alignItems: "center",
    borderBottom: "1px solid #d0cdc3",
    transition: "background-color 140ms ease, padding 140ms ease",
    ":hover": {
      paddingInline: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.55)",
    },
  },
  rowNumber: {
    color: "#989990",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.06em",
  },
  cardTile: {
    minWidth: 0,
    minHeight: 0,
    paddingBlock: 0,
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    alignItems: "start",
    alignContent: "start",
    borderBottom: 0,
    ":hover": {
      paddingInline: 0,
      backgroundColor: "transparent",
      transform: "translateY(-4px)",
    },
  },
  tileNumber: {
    minWidth: "31px",
    minHeight: "22px",
    paddingInline: "5px",
    position: "absolute",
    zIndex: 1,
    top: "9px",
    left: "9px",
    display: "grid",
    placeItems: "center",
    border: "1px solid #1b1d19",
    borderRadius: "2px",
    color: "#1b1d19",
    backgroundColor: "#caff42",
  },
  cardImageFrame: {
    width: {
      default: "46px",
      "@media (max-width: 820px)": "40px",
    },
    aspectRatio: "5 / 7",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    border: "1px solid #b4b3aa",
    borderRadius: "3px",
    backgroundColor: "#dedbd2",
    boxShadow: "3px 3px 0 rgba(27, 29, 25, 0.09)",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },
  cardImageFallback: {
    color: "#777970",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "6px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  tileImageFrame: {
    width: "100%",
    borderRadius: "5px",
    boxShadow: "6px 6px 0 rgba(27, 29, 25, 0.12)",
  },
  cardIdentity: {
    minWidth: 0,
    paddingRight: "22px",
    display: "grid",
    gap: "3px",
  },
  cardName: {
    overflow: "hidden",
    color: "#20221d",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "18px",
    fontWeight: 400,
    letterSpacing: "-0.015em",
    lineHeight: 1.1,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tileIdentity: {
    padding: "15px 4px 0",
  },
  tileName: {
    overflow: "visible",
    fontSize: "17px",
    lineHeight: 1.05,
    textOverflow: "clip",
    whiteSpace: "normal",
  },
  typeLine: {
    overflow: "hidden",
    color: "#7b7c74",
    fontSize: "9px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  printing: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr)",
    alignItems: "center",
    gap: "10px",
  },
  tilePrinting: {
    padding: "10px 4px 0",
    gridTemplateColumns: "40px minmax(0, 1fr)",
    gap: "8px",
  },
  setCode: {
    minHeight: "24px",
    display: "grid",
    placeItems: "center",
    border: "1px solid #b4b3aa",
    borderRadius: "2px",
    color: "#1b1d19",
    backgroundColor: "#caff42",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  printingCopy: {
    overflow: "hidden",
    color: "#70726a",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "7px",
    letterSpacing: "0.05em",
    lineHeight: 1.55,
    textOverflow: "ellipsis",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  message: {
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    gap: "22px",
    borderBottom: "1px solid #bbb9af",
  },
  messageMark: {
    width: "54px",
    height: "72px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    border: "1px solid #1b1d19",
    borderRadius: "3px",
    backgroundColor: "#caff42",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "9px",
    boxShadow: "6px 6px 0 #dedbd2",
  },
  messageTitle: {
    color: "#242620",
    fontFamily: '"Iowan Old Style", "Baskerville", serif',
    fontSize: "22px",
    fontWeight: 400,
  },
  messageCopy: {
    margin: "6px 0 0",
    color: "#77786f",
    fontSize: "11px",
  },
  moreButton: {
    width: "100%",
    minHeight: "58px",
    paddingInline: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: "0 0 1px",
    borderStyle: "solid",
    borderColor: "#1b1d19",
    borderRadius: 0,
    color: "#1b1d19",
    backgroundColor: "transparent",
    fontFamily: '"SFMono-Regular", "Cascadia Mono", monospace',
    fontSize: "8px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background-color 160ms ease",
    ":hover:not(:disabled)": {
      backgroundColor: "#caff42",
    },
    ":focus-visible": {
      outline: "2px solid #1b1d19",
      outlineOffset: "3px",
    },
    ":disabled": {
      cursor: "wait",
      opacity: 0.58,
    },
  },
  moreCount: {
    color: "#73756d",
  },
});
