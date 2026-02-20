export enum Direction {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
  DOWN = 'DOWN',
  UP = 'UP',
  DOWN_RIGHT = 'DOWN_RIGHT',
  DOWN_LEFT = 'DOWN_LEFT',
  UP_RIGHT = 'UP_RIGHT',
  UP_LEFT = 'UP_LEFT',
}

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.RIGHT]: { dx: 1, dy: 0 },
  [Direction.LEFT]: { dx: -1, dy: 0 },
  [Direction.DOWN]: { dx: 0, dy: 1 },
  [Direction.UP]: { dx: 0, dy: -1 },
  [Direction.DOWN_RIGHT]: { dx: 1, dy: 1 },
  [Direction.DOWN_LEFT]: { dx: -1, dy: 1 },
  [Direction.UP_RIGHT]: { dx: 1, dy: -1 },
  [Direction.UP_LEFT]: { dx: -1, dy: -1 },
};

export const ALL_DIRECTIONS = Object.values(Direction);
