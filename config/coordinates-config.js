// config/coordinates-config.js

/**
 * ITM (Israeli Transverse Mercator) projection definition
 * Used for converting Israeli grid coordinates to WGS84
 */
const ITM =
  "+proj=tmerc +lat_0=31.7343936111111 +lon_0=35.2045169444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=23.772,17.49,17.859,-0.3132,-1.85274,1.67299,-5.4262 +units=m +no_defs +type=crs";

/**
 * WGS84 projection definition
 * Standard geographic coordinate system used by GPS
 */
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

module.exports = { ITM, WGS84 };
