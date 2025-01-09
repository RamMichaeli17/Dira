// config/coordinates-config.js

/**
 * ITM (Israeli Transverse Mercator) projection definition
 * Used for converting Israeli grid coordinates to WGS84
 */
const ITM = "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444444 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=0,0,-48,0,0,0,0 +units=m +no_defs";

/**
 * WGS84 projection definition
 * Standard geographic coordinate system used by GPS
 */
const WGS84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

module.exports = { ITM, WGS84 };