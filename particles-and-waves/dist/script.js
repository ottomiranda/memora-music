var clockmaker;
(function(clockmaker) {
  "use strict";
  var StageHelper = (function() {
    function StageHelper() {}
    StageHelper.highDPI = function(stage, w, h) {
      var backingRatio = StageHelper._getBackingRatio(stage);
      var scale = Math.max(1, (window.devicePixelRatio || 1) / backingRatio);
      var canvas = stage.canvas,
        style = canvas.style;
      //console.log(scale, window.devicePixelRatio, backingRatio)
      canvas.width = w * scale;
      canvas.height = h * scale;
      //style.width = w + "px";
      //style.height = h + "px";
      stage.scaleX = stage.scaleY = scale;
      return this;
    };
    StageHelper._getBackingRatio = function(stage) {
      var ctx = stage.canvas.getContext("2d");
      return ctx.backingStorePixelRatio || ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || 1;
    };
    return StageHelper;
  })();
  clockmaker.StageHelper = StageHelper;
})(clockmaker || (clockmaker = {}));
///<reference path="../libs/easeljs/easeljs.d.ts" />
var __extends = (this && this.__extends) || function(d, b) {
  for (var p in b)
    if (b.hasOwnProperty(p)) d[p] = b[p];

  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var project;
(function(project) {
  "use strict";
  /**
   * @see FrocessingSample by nutsu http://wonderfl.net/c/kvXp
   */
  var CrossGraphicsContainer = (function(_super) {
    __extends(CrossGraphicsContainer, _super);

    function CrossGraphicsContainer() {
      _super.call(this);
      this.time = 0;
      /** 線自体の個数です。 */
      this.MAX_LINES = 10;
      /** 線の水平方向の頂点数です。 */
      this.MAX_VERTEX = 10;
      this.mouseEnabled = false;
      noise.seed(0);
      this.vertexArr = [];
      for (var i = 0; i < this.MAX_LINES; i++) {
        this.vertexArr[i] = [];
        var num = (this.MAX_VERTEX - 1) * Math.random() * Math.random() + 1;
        for (var j = 0; j <= num; j++) {
          this.vertexArr[i][j] = 0;
        }
      }
      this.on("tick", this.handleTick, this);
    }
    /**
     * エンターフレームイベント
     * @param event
     */
    CrossGraphicsContainer.prototype.handleTick = function(event) {
      this.time = Date.now() / 5000;
      this.graphics.clear();
      for (var i = 0; i < this.MAX_LINES; i++) {
        this.drawWave(this.vertexArr[i], (0.05 * i) + 0.001, // ゼロ対策(ゼロのときに太さが1pxになるため)
          i * 0.10);
      }
    };
    /**
     * ウェーブを描きます。
     * @param vertexArr    頂点配列
     * @param strokeSize    線の太さ
     * @param timeOffset    波のオフセット
     */
    CrossGraphicsContainer.prototype.drawWave = function(vertexArr, strokeSize, timeOffset) {
      var vertexNum = vertexArr.length - 1;
      var stageW = window.innerWidth;
      var stageH = window.innerHeight;
      // draw #1
      this.graphics.setStrokeStyle(strokeSize).beginStroke("white");
      for (var i = 0; i <= vertexNum; i++) {
        var noiseValue = noise.perlin2(i * 0.2, this.time + timeOffset);
        // 小さくする
        noiseValue *= 0.5;
        //vertexArr[i] += (((noiseValue) * innerHeight * 2) - vertexArr[i]) * 0.05;
        vertexArr[i] = (noiseValue) * innerHeight * 2;
      }
      var BASE_Y = stageH / 2;
      var points = [];
      points.push({
        x: -200,
        y: BASE_Y
      });
      for (var i = 0; i <= vertexNum; i++) {
        points.push({
          x: (stageW * (i / vertexNum)) >> 0,
          y: vertexArr[i] + BASE_Y
        });
      }
      points.push({
        x: stageW + 200,
        y: BASE_Y
      });
      for (var i = 0; i < points.length; i++) {
        if (i >= 2) {
          // マウスの軌跡を変数に保存
          var p0x = points[i - 0].x;
          var p0y = points[i - 0].y;
          var p1x = points[i - 1].x;
          var p1y = points[i - 1].y;
          var p2x = points[i - 2].x;
          var p2y = points[i - 2].y;
          // カーブ用の頂点を割り出す
          var curveStartX = (p2x + p1x) / 2;
          var curveStartY = (p2y + p1y) / 2;
          var curveEndX = (p0x + p1x) / 2;
          var curveEndY = (p0y + p1y) / 2;
          // カーブは中間点を結ぶ。マウスの座標は制御点として扱う。
          this.graphics
            .moveTo(curveStartX, curveStartY)
            .curveTo(p1x, p1y, curveEndX, curveEndY);
        }
      }
      this.graphics.endStroke();
    };
    return CrossGraphicsContainer;
  })(createjs.Shape);
  project.CrossGraphicsContainer = CrossGraphicsContainer;
})(project || (project = {}));
///<reference path="../libs/easeljs/easeljs.d.ts" />
var project;
(function(project) {
  "use strict";
  var SpotLightContainer = (function(_super) {
    __extends(SpotLightContainer, _super);

    function SpotLightContainer() {
      _super.call(this);
    }
    SpotLightContainer.prototype.drawContents = function(w, h) {
      this.graphics.clear();
      this.graphics.beginFill(createjs.Graphics.getHSL(0, 0, 0)).drawRect(0, 0, w, h);
      var dx = w * 1 / 3 + w / 10 * Math.sin(Date.now() / 4000);
      var dy = h * 1 / 3;
      var size = w / 2;
      // もやっとした円
      this.graphics.beginRadialGradientFill([createjs.Graphics.getHSL(0, 0, 100, 0.3 + 0.008 * Math.random()),
        createjs.Graphics.getHSL(0, 0, 0, 0)
      ], [0.0, 1.0], dx, dy, 0, dx, dy, size);
      this.graphics.drawCircle(dx, dy, size);
      this.graphics.endFill();
      var dx = w * 3 / 4 + w / 15 * Math.cos(Date.now() / 10000);
      var dy = h * 2 / 3;
      var size = w / 3;
      // もやっとした円
      this.graphics.beginRadialGradientFill([
        createjs.Graphics.getHSL(0, 0, 100, 0.3 + 0.006 * Math.random()),
        createjs.Graphics.getHSL(0, 0, 0, 0)
      ], [0.0, 1.0], dx, dy, 0, dx, dy, size);
      this.graphics.drawCircle(dx, dy, size);
      this.graphics.endFill();
    };
    return SpotLightContainer;
  })(createjs.Shape);
  project.SpotLightContainer = SpotLightContainer;
})(project || (project = {}));
///<reference path="../libs/easeljs/easeljs.d.ts" />
var project;
(function(project) {
  "use strict";
  /**
   * 大量のパーティクルを発生させてみた
   * マウスを押してる間でてくるよ
   * @see http://wonderfl.net/c/4WjT
   * @class demo.ParticleSample
   */
  var ParticleContainer = (function(_super) {
    __extends(ParticleContainer, _super);

    function ParticleContainer(numParticlesPerFrame) {
      _super.call(this);
      this._time = 0;
      this._bg = new createjs.Shape();
      this.addChild(this._bg);
      this._emitter = new ParticleEmitter(numParticlesPerFrame);
      this.addChild(this._emitter.container);
      this.on("tick", this.enterFrameHandler, this);
    }
    /**
     * エンターフレームイベント
     * @param event
     */
    ParticleContainer.prototype.enterFrameHandler = function(event) {
      this._emitter.emit(window.innerWidth * Math.random(), window.innerHeight / 5 * (Math.random() - 0.5) + window.innerHeight * 6 / 10);
      this._emitter.update();
      var hue = Math.sin(-1 * Date.now() / 400 * Math.PI / 180) * 45 + 200;
      // 背景
      var color1 = createjs.Graphics.getHSL(hue, 100, 60);
      var color2 = createjs.Graphics.getHSL(hue + 120, 100, 40);
      this._bg.graphics
        .clear()
        .beginLinearGradientFill([color1, color2], [0, 1], 0, 0, 0, window.innerHeight)
        .drawRect(0, 0, window.innerWidth, window.innerHeight);
    };
    return ParticleContainer;
  })(createjs.Container);
  project.ParticleContainer = ParticleContainer;
  /**
   * パーティクル発生装置。マウス座標から速度を計算する。
   * @class project.Emitter
   */
  var Emitter = (function() {
    /**
     * @constructor
     */
    function Emitter() {
      /** 速度(X方向) */
      this.vy = 0;
      /** 速度(Y方向) */
      this.x = 0;
      /** マウスのX座標 */
      this.latestY = 0;
      /** マウスのY座標 */
      this.latestX = 0;
      /** パーティクル発生のX座標 */
      this.y = 0;
      /** パーティクル発生のY座標 */
      this.vx = 0;
    }
    /**
     * パーティクルエミッターの計算を行います。この計算によりマウスの引力が計算されます。
     * @method
     */
    Emitter.prototype.update = function() {
      var dx = this.latestX - this.x;
      var dy = this.latestY - this.y;
      var d = Math.sqrt(dx * dx + dy * dy) * 0.2;
      var rad = Math.atan2(dy, dx);
      this.vx += Math.cos(rad) * d;
      this.vy += Math.sin(rad) * d;
      this.vx *= 0.4;
      this.vy *= 0.4;
      this.x += this.vx;
      this.y += this.vy;
    };
    return Emitter;
  })();
  /**
   * パーティクルエミッター
   * @class project.ParticleEmitter
   */
  var ParticleEmitter = (function(_super) {
    __extends(ParticleEmitter, _super);
    /**
     * @constructor
     */
    function ParticleEmitter(numParticles) {
      _super.call(this);
      this.PRE_CACHE_PARTICLES = 100;
      this.numParticles = numParticles;
      this.container = new createjs.Container();
      this._particleActive = [];
      this._particlePool = [];
      /* 予め必要そうな分だけ作成しておく */
      for (var i = 0; i < this.PRE_CACHE_PARTICLES; i++) {
        this._particlePool.push(new Particle());
      }
    }
    /**
     * パーティクルを発生させます。
     * @param {number} x パーティクルの発生座標
     * @param {number} y パーティクルの発生座標
     * @method
     */
    ParticleEmitter.prototype.emit = function(x, y) {
      for (var i = 0; i < this.numParticles; i++) {
        this.getNewParticle(x, y);
      }
    };
    /**
     * パーティクルを更新します。
     * @method
     */
    ParticleEmitter.prototype.update = function() {
      _super.prototype.update.call(this);
      for (var i = 0; i < this._particleActive.length; i++) {
        var p = this._particleActive[i];
        if (!p.getIsDead()) {
          // 跳ね返り判定するならココに書く
          p.update();
        } else {
          this.removeParticle(p);
        }
      }
    };
    /**
     * パーティクルを追加します。
     * @param {THREE.Vector3} emitPoint
     * @method
     */
    ParticleEmitter.prototype.getNewParticle = function(emitX, emitY) {
      var p = this.fromPool();
      p.resetParameters(emitX, emitY);
      this._particleActive.push(p);
      this.container.addChild(p);
      return p;
    };
    /**
     * パーティクルを削除します。
     * @param {Particle} particle
     * @method
     */
    ParticleEmitter.prototype.removeParticle = function(p) {
      this.container.removeChild(p);
      var index = this._particleActive.indexOf(p);
      if (index > -1) {
        this._particleActive.splice(index, 1);
      }
      this.toPool(p);
    };
    /**
     * アクティブなパーティクルを取り出します。
     * @returns {project.Particle[]}
     * @method
     */
    ParticleEmitter.prototype.getActiveParticles = function() {
      return this._particleActive;
    };
    /**
     * プールからインスタンスを取り出します。
     * プールになければ新しいインスタンスを作成します。
     * @returns {project.Particle}
     * @method
     */
    ParticleEmitter.prototype.fromPool = function() {
      if (this._particlePool.length > 0)
        return this._particlePool.shift();
      else
        return new Particle();
    };
    /**
     * プールにインスタンスを格納します。
     * @param {project.Particle}
     * @method
     */
    ParticleEmitter.prototype.toPool = function(particle) {
      this._particlePool.push(particle);
    };
    return ParticleEmitter;
  })(Emitter);
  /**
   * @class demo.Particle
   */
  var Particle = (function(_super) {
    __extends(Particle, _super);
    /**
     * コンストラクタ
     * @constructor
     */
    function Particle() {
      _super.call(this);
      this.MAX_SIZE = 128;
      var size = Math.random() * Math.random() * Math.random() * Math.random() * this.MAX_SIZE + 2;
      this.size = size;
      var colorHsl = createjs.Graphics.getHSL(0, 0, 20 + Math.random() * 50);
      this.graphics.clear();
      if (Math.random() < 0.4) {
        // もやっとした円
        this.graphics.beginRadialGradientFill([colorHsl, "#000000"], [0.0, 1.0], 0, 0, 0, 0, 0, this.size);
      } else if (Math.random() < 0.1) {
        // 輪郭だけの円
        this.graphics
          .setStrokeStyle(4) // 線の太さ
          .beginStroke(createjs.Graphics.getRGB(255, 255, 255));
      } else if (Math.random() < 0.3) {
        // 輪郭だけの円
        this.graphics
          .setStrokeStyle(1.5) // 線の太さ
          .beginStroke(createjs.Graphics.getRGB(255, 255, 255));
      } else {
        // キリッとした円
        this.graphics.beginFill(colorHsl);
      }
      this.graphics.drawCircle(0, 0, this.size);
      this.graphics.endFill();
      // 大量のオブジェクトを重ねるとおかしくなる
      this.compositeOperation = "lighter";
      this.mouseEnabled = false;
      var padding = 2;
      this.cache(-this.size - padding, -this.size - padding, this.size * 2 + padding * 2, this.size * 2 + padding * 2);
      this._destroy = true;
    }
    /**
     * パーティクルをリセットします。
     * @param emitX
     * @param emitY
     */
    Particle.prototype.resetParameters = function(emitX, emitY) {
      this.x = emitX;
      this.y = emitY;
      this.vx = (Math.random() - 0.5) * 2.0;
      this.vy = (Math.random() - 0.5) * 2.0;
      this.life = Math.random() * Math.random() * 400 + 40;
      this.vSize = Math.random() * 0.5;
      this.baseAlpha = 0.7;
      this._destroy = false;
      this._count = 0;
      this.alpha = 1.0;
      this.scaleX = this.scaleY = 1.0;
    };
    /**
     * パーティクル個別の内部計算を行います。
     * @method
     */
    Particle.prototype.update = function() {
      // 重力計算
      this.vy -= 0.03;
      // 摩擦計算
      this.vx *= 0.99;
      this.vy *= 0.99;
      this.x += this.vx;
      this.y += this.vy;
      this._count++;
      var maxD = (1 - this._count / this.life);
      var sizeNew = (1 - this._count / this.life * this.vSize);
      this.alpha = Math.random() * 0.3 + this.baseAlpha * maxD;
      this.scaleX = this.scaleY = sizeNew;
      // 死亡フラグ
      if (this.life < this._count) {
        this._destroy = true;
        this.parent.removeChild(this);
      }
    };
    /**
     * パーティクルが死んでいるかどうかを確認します。
     * @returns {boolean}
     * @method
     */
    Particle.prototype.getIsDead = function() {
      return this._destroy;
    };
    return Particle;
  })(createjs.Shape);
})(project || (project = {}));
///<reference path="../libs/easeljs/easeljs.d.ts" />
///<reference path="CrossGraphicsContainer.ts" />
///<reference path="ParticleContainer.ts" />
///<reference path="StageHelper.ts" />
var project;
(function(project) {
  "use strict";
  /**
   * パーティクルデモのメインクラスです。
   * @class project.Main
   */
  var MainBase = (function() {
    /**
     * @constructor
     */
    function MainBase(emitPerFrame) {
      var _this = this;
      // 初期設定
      this.stageBase = new createjs.Stage("canvasBase");
      // パーティクルサンプルを作成
      var sample = new project.ParticleContainer(emitPerFrame);
      this.stageBase.addChild(sample);
      // Tickerを作成
      createjs.Ticker.setFPS(60);
      createjs.Ticker.timingMode = createjs.Ticker.RAF;
      createjs.Ticker.on("tick", this.handleTick, this);
      var stageOverlay = new createjs.Stage("canvasOverlay");
      this.stageOverlay = stageOverlay;
      // グラフィック
      this.spotLightContainer = new project.SpotLightContainer();
      stageOverlay.addChild(this.spotLightContainer);
      // 初期設定
      this.stageCalcInside = new createjs.Stage(document.createElement("canvas"));
      this.stageCalcInside.autoClear = false;
      // パーティクルサンプルを作成
      var crossGraphicsContainer = new project.CrossGraphicsContainer();
      this.stageCalcInside.addChild(crossGraphicsContainer);
      this.buildUi();
      // リサイズイベント
      this.handleResize();
      window.addEventListener("resize", function() {
        _this.handleResize();
      });
      // iframe埋め込み & スマホ対策
      setTimeout(function() {
        _this.handleResize();
      }, 100);
    }
    MainBase.prototype.buildUi = function() {};
    /**
     * エンターフレームイベント
     */
    MainBase.prototype.handleTick = function() {
      this.spotLightContainer.drawContents(innerWidth, innerHeight);
      // create residual image effect
      this.stageBase.update();
      var context = this.stageCalcInside.canvas.getContext("2d");
      context.fillStyle = "rgba(0, 0, 0, " + 0.35 * Math.random() + ")";
      context.fillRect(0, 0, this.stageCalcInside.canvas.width, this.stageCalcInside.canvas.height);
      this.stageCalcInside.update();
      this.stageOverlay.update();
      var context2 = this.stageOverlay.canvas.getContext("2d");
      context2.globalCompositeOperation = "lighter";
      context2.drawImage(this.stageCalcInside.canvas, 0, 0);
    };
    /**
     * リサイズイベント
     */
    MainBase.prototype.handleResize = function() {
      clockmaker.StageHelper.highDPI(this.stageBase, innerWidth, innerHeight);
      clockmaker.StageHelper.highDPI(this.stageOverlay, innerWidth, innerHeight);
      clockmaker.StageHelper.highDPI(this.stageCalcInside, innerWidth, innerHeight);
    };
    return MainBase;
  })();
  project.MainBase = MainBase;
})(project || (project = {}));
///<reference path="../libs/easeljs/easeljs.d.ts" />
///<reference path="CrossGraphicsContainer.ts" />
///<reference path="ParticleContainer.ts" />
///<reference path="StageHelper.ts" />
///<reference path="MainBase.ts" />
var project;
(function(project) {
  "use strict";
  /** 1フレーム間に発生させる Particle 数 */
  var NUM_PARTICLES = 1;
  // 起動コード
  window.addEventListener("DOMContentLoaded", function() {
    new project.Main(NUM_PARTICLES);
  });
  /**
   * パーティクルデモのメインクラスです。
   * @class project.Main
   */
  var Main = (function(_super) {
    __extends(Main, _super);
    /**
     * @constructor
     */
    function Main(emitPerFrame) {
      _super.call(this, emitPerFrame);
      this.buildUi();
    }
    Main.prototype.buildUi = function() {};
    /**
     * リサイズイベント
     */
    Main.prototype.handleResize = function() {
      _super.prototype.handleResize.call(this);
    };
    return Main;
  })(project.MainBase);
  project.Main = Main;
})(project || (project = {}));

/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function(global) {
  var module = global.noise = {};

  function Grad(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  Grad.prototype.dot2 = function(x, y) {
    return this.x * x + this.y * y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x * x + this.y * y + this.z * z;
  };

  var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)
  ];

  var p = [151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
  ];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  module.seed = function(seed) {
    if (seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed >> 8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  module.seed(0);

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5 * (Math.sqrt(3) - 1);
  var G2 = (3 - Math.sqrt(3)) / 6;

  var F3 = 1 / 3;
  var G3 = 1 / 6;

  // 2D simplex noise
  module.simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin + yin) * F2; // Hairy factor for 2D
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin - j + t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 1;
      j1 = 0;
    } else { // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1 = 0;
      j1 = 1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i + perm[j]];
    var gi1 = gradP[i + i1 + perm[j + j1]];
    var gi2 = gradP[i + 1 + perm[j + 1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  module.simplex3 = function(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin + yin + zin) * F3; // Hairy factor for 2D
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var k = Math.floor(zin + s);

    var t = (i + j + k) * G3;
    var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin - j + t;
    var z0 = zin - k + t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else if (x0 < z0) {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 0;
        j2 = 1;
        k2 = 1;
      } else {
        i1 = 0;
        j1 = 1;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i + perm[j + perm[k]]];
    var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
    var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
    var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  // 2D Perlin Noise
  module.perlin2 = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x),
      Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X;
    y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255;
    Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = gradP[X + perm[Y]].dot2(x, y);
    var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
      lerp(n00, n10, u),
      lerp(n01, n11, u),
      fade(y));
  };

  // 3D Perlin Noise
  module.perlin3 = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x),
      Y = Math.floor(y),
      Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X;
    y = y - Y;
    z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255;
    Y = Y & 255;
    Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
    var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
    var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
    var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
    var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
    var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
    var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
    var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

    // Compute the fade curve value for x, y, z
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    // Interpolate
    return lerp(
      lerp(
        lerp(n000, n100, u),
        lerp(n001, n101, u), w),
      lerp(
        lerp(n010, n110, u),
        lerp(n011, n111, u), w),
      v);
  };

})(this);