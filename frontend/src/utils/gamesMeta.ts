/** Vue hub game list — must stay aligned with `public/games/games-common.js` META. */

export interface GameMeta {
  id: string;
  title: string;
  blurb: string;
}

export const GAME_META: GameMeta[] = [
  { id: "snake", title: "贪吃蛇", blurb: "慢慢爬，吃到豆子就变长" },
  { id: "2048", title: "2048", blurb: "滑动合并相同数字" },
  { id: "mines", title: "扫雷", blurb: "小心挖开，别踩到雷" },
  { id: "gomoku", title: "五子棋", blurb: "你先手，和电脑下一盘" },
  { id: "tetris", title: "俄罗斯方块", blurb: "慢慢下落，消行得分" },
  { id: "puzzle", title: "数字拼图", blurb: "三乘三，步数越少越好" },
  { id: "match3", title: "消消乐", blurb: "交换相邻格子，连成三个" },
  { id: "breakout", title: "打砖块", blurb: "左右移动挡板，打掉彩色砖块" },
  { id: "flip", title: "记忆翻牌", blurb: "翻开配对，步数越少越好" },
  { id: "guess", title: "猜数字", blurb: "根据提示猜出神秘数字" },
  { id: "tictactoe", title: "井字棋", blurb: "你先手，和电脑下一盘" },
  { id: "maze", title: "走迷宫", blurb: "找到路，走到星星出口" },
];
