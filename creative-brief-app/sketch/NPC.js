export default class NPC {
  /**
   * N.B. y is the of the bottom left corner, not the top left
   */
  constructor({ xy, w, h, colour, onGround }) {
    let [x, y] = xy;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.onGround = onGround;
    this.colour = colour;
  }

  applyGravity() {
    while (!this.onGround(this.x, this.y)) {
      this.y++;
    }
  }
}
