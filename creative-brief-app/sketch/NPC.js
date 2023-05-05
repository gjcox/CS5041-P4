export default class NPC {
    /**
     * N.B. y is the of the bottom left corner, not the top left 
     */
    constructor(x, y, w, h, colour, onGround) {
      this.x = x
      this.y = y
      this.w = w
      this.h = h
      this.onGround = onGround
      this.colour = colour 
    }
    
    applyGravity() {
      while (!this.onGround(this.x, this.y)) {
        this.y++
      }
    }
    
  }