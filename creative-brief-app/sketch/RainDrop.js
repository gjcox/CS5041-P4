/* The following code is adapted from  https://editor.p5js.org/kelsierose94/sketches/MU2Y21aG0, by kelsierose94. Accessed 05/05/2023. */

export default class RainDrop {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * -height;

    this.update = function () {
      this.speed = 5 + Math.random() * 5;
      this.gravity = 1.05;
      this.y = this.y + this.speed * this.gravity;

      if (this.y > height) {
        this.y = Math.random() * -height;
        this.gravity = 0;
      }
    };
  }

  /* End of adapted code. */
}
