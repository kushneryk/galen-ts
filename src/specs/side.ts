export enum Side {
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
}

export function oppositeSide(side: Side): Side {
  switch (side) {
    case Side.LEFT:
      return Side.RIGHT;
    case Side.RIGHT:
      return Side.LEFT;
    case Side.TOP:
      return Side.BOTTOM;
    case Side.BOTTOM:
      return Side.TOP;
  }
}

export function parseSide(text: string): Side {
  const normalized = text.trim().toLowerCase();
  switch (normalized) {
    case "left":
      return Side.LEFT;
    case "right":
      return Side.RIGHT;
    case "top":
      return Side.TOP;
    case "bottom":
      return Side.BOTTOM;
    default:
      throw new Error(`Unknown side: "${text}"`);
  }
}
