var Measurement = (function (exports) {
  'use strict';

  class Add {
    constructor(a, b) {
      this.a = a;
      this.b = b;
    }

    get result() {
      return this.a + this.b;
    }
  }

  class Minus {
    constructor(a, b) {
      this.a = a;
      this.b = b;
    }

    get result() {
      return this.a - this.b;
    }
  }

  exports.Add = Add;
  exports.Minus = Minus;

  return exports;

})({});
