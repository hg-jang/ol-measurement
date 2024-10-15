import { Overlay } from "ol";
import Control from "ol/control/Control";
import EventType from "ol/events/EventType";
import { getArea, getLength } from "ol/sphere";
import { CLASS_UNSELECTABLE, CLASS_CONTROL } from "ol/css";
import OverlayPositioning from "ol/OverlayPositioning";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import Draw from "ol/interaction/Draw";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { unByKey } from "ol/Observable";
import GeometryType from "ol/geom/GeometryType";

/**
 * @typedef {Object} Options
 * @property {string} [className] name.
 * @property {string} distanceButtonClassName name.
 * @property {string} [areaButtonClassName]
 * @property {string} [eraserButtonClassName]
 * @property {string | HTMLElement} [distanceButtonLabel]
 * @property {string | HTMLElement} [areaButtonLabel]
 * @property {string | HTMLElement} [eraserButtonLabel]
 * @property {string} [distanceBtnTipLabel]
 * @property {string} [areaBtnTipLabel]
 * @property {string} [eraserBtnTipLabel]
 * @property {boolean} [useDistance]
 * @property {boolean} [useArea]
 * @property {boolean} [useEraser]
 * @property {boolean} [useTooltip]
 * @property {string} [layerId='measurement-layer'] measurement layer id.
 */
/**
 * @classdesc
 *
 * NOTE
 * You need to add a layer with the id 'measurement-layer' to use the measurement control.
 * md = measure distance / ma = measure area
 */
class Measurement extends Control {
  /**
   * @private
   * @type {HTMLElement}
   */
  _distanceButton;

  /**
   * @private
   * @type {HTMLElement}
   */
  _areaButton;

  /**
   * @private
   * @type {HTMLElement}
   */
  _eraserButton;

  /**
   * @private
   * @type {boolean}
   */
  _useDistance;

  /**
   * @private
   * @type {boolean}
   */
  _useArea;

  /**
   * @private
   * @type {boolean}
   */
  _useEraser;

  /**
   * @private
   * @type {boolean}
   */
  _useTooltip;

  /**
   * Currently drawn feature.
   * @private
   * @type {import('ol/Feature').default}
   */
  _sketch;

  /**
   * The help tooltip element.
   * @private
   * @type {HTMLElement}
   */
  _helpTooltipElement;

  /**
   * Overlay to show the help messages.
   * @private
   * @type {import('ol/Overlay').default}
   */
  _helpTooltip;

  /**
   * The measure tooltip element.
   * @private
   * @type {HTMLElement}
   */
  _measureTooltipElement;

  /**
   * Overlay to show the measurement.
   * @private
   * @type {import('ol/Overlay').default}
   */
  _measureTooltip;

  /**
   * Message to show when the user is drawing a polygon.
   * @private
   */
  _continuePolygonMsg = "더블클릭하여 측정을 끝내세요.";

  /**
   * Message to show when the user is drawing a line.
   * @private
   */
  _continueLineMsg = "더블클릭하여 측정을 끝내세요.";

  /**
   * The draw instance.
   * @private
   * @type {import('ol/interaction/Draw').default}
   */
  _draw;

  /**
   * @private
   * @type {'distance_measureing' | 'area_measureing' | 'none'}
   */
  _status = "none";

  /**
   * @private
   * @type {string}
   */
  _layerId;

  /**
   *
   * @param {import("ol/control/Control").Options & Options} options
   */
  constructor(options) {
    // @ts-ignore
    options = options ? options : {};

    super({
      element: document.createElement("div"),
      target: options.target,
    });

    this._layerId = options.layerId || "measurement-layer";

    this._useDistance =
      options.useDistance !== undefined ? options.useDistance : true;
    this._useArea = options.useArea !== undefined ? options.useArea : true;
    this._useEraser =
      options.useEraser !== undefined ? options.useEraser : true;
    this._useTooltip =
      options.useTooltip !== undefined ? options.useTooltip : false;

    const className =
      options.className !== undefined ? options.className : "ol-measurement";

    const distanceButtonClassName =
      options.distanceButtonClassName !== undefined
        ? options.distanceButtonClassName
        : className + "-distance";

    const areaButtonClassName =
      options.areaButtonClassName !== undefined
        ? options.areaButtonClassName
        : className + "-area";

    const eraserButtonClassName =
      options.eraserButtonClassName !== undefined
        ? options.eraserButtonClassName
        : className + "-eraser";

    const distanceButtonLabel =
      options.distanceButtonLabel !== undefined
        ? options.distanceButtonLabel
        : (document.createElement("img").src = "../assets/polyline.svg");
    const areaButtonLabel =
      options.areaButtonLabel !== undefined
        ? options.areaButtonLabel
        : (document.createElement("img").src = "../assets/polygon.svg");
    const eraserButtonLabel =
      options.eraserButtonLabel !== undefined
        ? options.eraserButtonLabel
        : (document.createElement("img").src = "../assets/eraser.svg");

    const distanceBtnTipLabel = options.distanceBtnTipLabel
      ? options.distanceBtnTipLabel
      : "Measure distance";
    const areaBtnTipLabel = options.areaBtnTipLabel
      ? options.areaBtnTipLabel
      : "Measure area";
    const eraserBtnTipLabel = options.eraserBtnTipLabel
      ? options.eraserBtnTipLabel
      : "Erase measurements";

    const mdLabelNode =
      typeof distanceButtonLabel === "string"
        ? document.createTextNode(distanceButtonLabel)
        : distanceButtonLabel;
    const maLabelNode =
      typeof areaButtonLabel === "string"
        ? document.createTextNode(areaButtonLabel)
        : areaButtonLabel;
    const eraserLabelNode =
      typeof eraserButtonLabel === "string"
        ? document.createTextNode(eraserButtonLabel)
        : eraserButtonLabel;

    if (this._useDistance) {
      this._distanceButton = document.createElement("button");
      this._distanceButton.title = distanceBtnTipLabel;
      this._distanceButton.className = distanceButtonClassName;
      this._distanceButton.setAttribute("type", "button");
      this._distanceButton.appendChild(mdLabelNode);
      this._distanceButton.addEventListener(
        EventType.CLICK,
        this._handleMdClick.bind(this),
        false
      );
    }

    if (this._useArea) {
      this._areaButton = document.createElement("button");
      this._areaButton.title = areaBtnTipLabel;
      this._areaButton.className = areaButtonClassName;
      this._areaButton.setAttribute("type", "button");
      this._areaButton.appendChild(maLabelNode);
      // @ts-ignore
      this._areaButton.addEventListener(
        EventType.CLICK,
        this._handleMaClick.bind(this),
        false
      );
    }

    if (this._useEraser) {
      this._eraserButton = document.createElement("button");
      this._eraserButton.title = eraserBtnTipLabel;
      this._eraserButton.className = eraserButtonClassName;
      this._eraserButton.setAttribute("type", "button");
      this._eraserButton.appendChild(eraserLabelNode);
      this._eraserButton.addEventListener(
        EventType.CLICK,
        this._handleEraserClick.bind(this),
        false
      );
    }

    const cssClasses =
      className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL;
    const element = this.element;

    element.className = cssClasses;
    this._useDistance && element.appendChild(this._distanceButton);
    this._useArea && element.appendChild(this._areaButton);
    this._useEraser && element.appendChild(this._eraserButton);

    if (options.useTooltip) {
      this._helpTooltipElement = document.createElement("div");
      this._helpTooltipElement.className = "ol-tooltip hidden";
      this._helpTooltip = new Overlay({
        element: this._helpTooltipElement,
        offset: [15, 0],
        positioning: OverlayPositioning.CENTER_LEFT,
      });
    }
  }

  /**
   * 거리 측정 버튼 클릭
   * @private
   * @param {MouseEvent} evt
   */
  _handleMdClick(evt) {
    evt.preventDefault();

    this.getMap().removeInteraction(this._draw);

    if (this._status === "distance_measureing") {
      this._status = "none";

      if (this._useTooltip) {
        this._helpTooltipElement.parentNode.removeChild(
          this._helpTooltipElement
        );
        this._helpTooltipElement = null;
      }

      this._distanceButton.classList.remove("active");
      this.set("active", false);
      return;
    }

    this.getMap().on("pointermove", this._pointerMoveHandler.bind(this));
    this.getMap()
      .getViewport()
      .addEventListener("mouseout", () => {
        this._helpTooltipElement &&
          this._helpTooltipElement.classList.add("hidden");
      });
    this._addInteraction("distance");
    this._status = "distance_measureing";
    this.set("active", true);
    this._areaButton.classList.remove("active");
    this._distanceButton.classList.add("active");
  }

  /**
   * 면적 측정 버튼 클릭
   * @private
   * @param {MouseEvent} evt
   */
  _handleMaClick(evt) {
    evt.preventDefault();

    this.getMap().removeInteraction(this._draw);

    //
    if (this._status === "area_measureing") {
      this._status = "none";
      this._areaButton.classList.remove("active");

      if (this._useTooltip) {
        this._helpTooltipElement.parentNode.removeChild(
          this._helpTooltipElement
        );
        this._helpTooltipElement = null;
      }

      this.set("active", false);
      return;
    }

    this.getMap().on("pointermove", this._pointerMoveHandler.bind(this));
    this.getMap()
      .getViewport()
      .addEventListener("mouseout", () => {
        this._helpTooltipElement &&
          this._helpTooltipElement.classList.add("hidden");
      });
    this._addInteraction("area");
    this._status = "area_measureing";
    this._distanceButton.classList.remove("active");
    this._areaButton.classList.add("active");
    this.set("active", true);
  }

  /**
   * 지우개 버튼 클릭
   * @private
   */
  _handleEraserClick() {
    // erase features
    const layer = this._getLayer(this._layerId);
    layer.getSource().clear();
    // const features = layer.getSource()?.getFeatures();
    // if (features) {
    //   features.forEach((fe) => {
    //     layer.getSource().removeFeature(fe);
    //   });
    // }

    // erase static tooltip
    const tooltips = document.querySelectorAll(".ol-tooltip-static");

    tooltips.forEach((tooltip) => {
      tooltip.parentNode?.removeChild(tooltip);
    });
  }

  /**
   * Handle pointer move.
   * @private
   * @param {import('ol/MapBrowserEvent').default} evt
   */
  _pointerMoveHandler(evt) {
    if (evt.dragging || !this._helpTooltipElement) {
      return;
    }
    let helpMsg = "클릭하여 측정을 시작하세요.";

    if (this._sketch) {
      const geom = this._sketch.getGeometry();
      if (geom instanceof Polygon) {
        helpMsg = this._continuePolygonMsg;
      } else if (geom instanceof LineString) {
        helpMsg = this._continueLineMsg;
      }
    }

    this._helpTooltipElement.innerHTML = helpMsg;
    this._helpTooltip.setPosition(evt.coordinate);

    this._helpTooltipElement.classList.remove("hidden");
  }

  /**
   * Format length output.
   * @private
   * @param {import ('ol/geom/LineString').default} line
   */
  _formatLength(line) {
    const length = getLength(line);
    let output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + " " + "km";
    } else {
      output = Math.round(length * 100) / 100 + " " + "m";
    }
    return output;
  }

  /**
   * Format area output.
   * @private
   * @param {import ('ol/geom/Polygon').default} polygon
   */
  _formatArea(polygon) {
    const area = getArea(polygon);
    let output;
    if (area > 10000) {
      output =
        Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
    } else {
      output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
    }
    return output;
  }

  /**
   * @private
   * @param {'distance' | 'area'} measureType
   */
  _addInteraction(measureType) {
    const type =
      measureType === "area" ? GeometryType.POLYGON : GeometryType.LINE_STRING;
    const map = this.getMap();
    const source = this._getLayer(this._layerId).getSource();

    this._draw = new Draw({
      source: source,
      type: type,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2,
        }),
        image: new Circle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
        }),
      }),
    });
    map.addInteraction(this._draw);

    this._createMeasureTooltip();
    this._useTooltip && this._createHelpTooltip();

    let listener;
    this._draw.on("drawstart", (evt) => {
      // set sketch
      this._sketch = evt.feature;

      // @ts-ignore
      let tooltipCoord = evt.coordinate;

      listener = this._sketch.getGeometry().on("change", (evt) => {
        const geom = evt.target;
        let output = "";
        if (geom instanceof Polygon) {
          output = this._formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          output = this._formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        this._measureTooltipElement.innerHTML = output;
        this._measureTooltip.setPosition(tooltipCoord);
      });
    });

    this._draw.on("drawend", () => {
      this._measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
      this._measureTooltip.setOffset([0, -7]);
      // unset sketch
      this._sketch = null;
      // unset tooltip so that a new one can be created
      this._measureTooltipElement = null;
      this._createMeasureTooltip();
      unByKey(listener);
    });
  }

  /**
   * Creates a new help tooltip
   * @private
   */
  _createHelpTooltip() {
    if (this._helpTooltipElement) {
      this._helpTooltipElement.parentNode.removeChild(this._helpTooltipElement);
    }
    this._helpTooltipElement = document.createElement("div");
    this._helpTooltipElement.className = "ol-tooltip hidden";
    this._helpTooltip = new Overlay({
      element: this._helpTooltipElement,
      offset: [15, 0],
      positioning: OverlayPositioning.CENTER_LEFT,
    });
    this.getMap().addOverlay(this._helpTooltip);
  }

  /**
   * Creates a new measure tooltip
   * @private
   */
  _createMeasureTooltip() {
    if (this._measureTooltipElement) {
      this._measureTooltipElement.parentNode.removeChild(
        this._measureTooltipElement
      );
    }
    this._measureTooltipElement = document.createElement("div");
    this._measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
    this._measureTooltip = new Overlay({
      element: this._measureTooltipElement,
      offset: [0, -15],
      positioning: OverlayPositioning.BOTTOM_CENTER,
      stopEvent: false,
      insertFirst: false,
    });
    this.getMap().addOverlay(this._measureTooltip);
  }

  /**
   * get layer by id
   * @private
   * @param {string} id
   */
  _getLayer(id) {
    return /** @type {import('ol/layer/Vector').default} */ (
      this.getMap()
        .getLayers()
        .getArray()
        .find((layer) => layer.get("id") === id)
    );
  }
}

export default Measurement;
