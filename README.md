# ol-measurement

A custom `Control` library for line/area measurements using [`openlayers`](https://github.com/openlayers/openlayers).

# Installation

```sh
$ npm i ol-measurement
```

# Getting Started

Import style.

```html
<link rel="stylesheet" href="node_modules/ol-measurement/style.css" />
```

or

```js
import "ol-measurement/style.css";
```

Create measurement layer. You must set `id` for `layer`.

```js
const measurementLayer = new VectorLayer({
  source: new Vector(),
});
measurementLayer.set("id", "measurement-layer");
```

Create and add `control`.

```js
const measurement = new Measurement({});

const map = new Map({
  target: "map",
  controls: defaultControls().extend([new FullScreen(), measurement]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    measurementLayer,
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
```
