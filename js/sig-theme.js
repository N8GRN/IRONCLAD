/* Dark-mode signature ink. Loaded after ui.js. Live strokes are cream;
   saved PNGs are remapped to #1a2332 so printed contracts stay readable. */
(function (IC) {
  IC.sigInkColor = function () {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "#fbf8f1" : "#1a2332";
  };

  IC.sigExportPng = function (canvas) {
    if (document.documentElement.getAttribute("data-theme") !== "dark") {
      return canvas.toDataURL("image/png");
    }
    var w = canvas.width;
    var h = canvas.height;
    var off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    var octx = off.getContext("2d");
    octx.drawImage(canvas, 0, 0);
    var img = octx.getImageData(0, 0, w, h);
    var d = img.data;
    var i;
    for (i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0) {
        d[i] = 26;
        d[i + 1] = 35;
        d[i + 2] = 50;
      }
    }
    octx.putImageData(img, 0, 0);
    return off.toDataURL("image/png");
  };

  IC.mountSigPad = function (canvas, onChange) {
    var ctx = canvas.getContext("2d");
    var drawing = false;
    var empty = true;
    var resize = function () {
      var ratio = window.devicePixelRatio || 1;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = IC.sigInkColor();
      empty = true;
      onChange("");
    };
    resize();
    var pos = function (e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener("pointerdown", function (e) {
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      var p = pos(e);
      ctx.strokeStyle = IC.sigInkColor();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      empty = false;
    });
    var up = function () {
      if (!drawing) return;
      drawing = false;
      if (!empty) onChange(IC.sigExportPng(canvas));
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas._clearPad = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      empty = true;
      onChange("");
    };
  };
})(window.IC);
