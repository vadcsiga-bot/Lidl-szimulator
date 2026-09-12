// Egyszerű, függőségmentes virtuális joystick érintőképernyőre.
export class Joystick {
  constructor(zoneElement) {
    this.zone = zoneElement;
    this.active = false;
    this.startX = 0;
    this.startY = 0;
    this.value = { x: 0, y: 0 }; // -1..1 tartomány

    this.base = document.createElement('div');
    this.base.className = 'joystick-base';
    this.stick = document.createElement('div');
    this.stick.className = 'joystick-stick';
    this.zone.appendChild(this.base);
    this.zone.appendChild(this.stick);

    this.maxDistance = 45;

    this._onStart = this._onStart.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onEnd = this._onEnd.bind(this);

    this.zone.addEventListener('touchstart', this._onStart, { passive: false });
    window.addEventListener('touchmove', this._onMove, { passive: false });
    window.addEventListener('touchend', this._onEnd);
    window.addEventListener('touchcancel', this._onEnd);

    // Egér támogatás teszteléshez desktopon is
    this.zone.addEventListener('mousedown', this._onStart);
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onEnd);
  }

  _getPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  _onStart(e) {
    e.preventDefault();
    this.active = true;
    const p = this._getPoint(e);
    this.startX = p.x;
    this.startY = p.y;
  }

  _onMove(e) {
    if (!this.active) return;
    e.preventDefault();
    const p = this._getPoint(e);
    let dx = p.x - this.startX;
    let dy = p.y - this.startY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), this.maxDistance);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * dist;
    const clampedY = Math.sin(angle) * dist;

    this.stick.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    this.value.x = clampedX / this.maxDistance;
    this.value.y = clampedY / this.maxDistance;
  }

  _onEnd() {
    this.active = false;
    this.value.x = 0;
    this.value.y = 0;
    this.stick.style.transform = `translate(0px, 0px)`;
  }
}
