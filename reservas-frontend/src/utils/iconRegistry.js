// src/utils/iconRegistry.js
// Registro de iconos para el frontend usando react-icons/fa
import {
  FaGlobeAmericas,
  FaPlaneDeparture,
  FaUmbrellaBeach,
  FaMountain,
  FaCity,
  FaPlane,
  FaMapMarkedAlt,
  FaFlag,
  FaPassport,
  FaStar,
  FaCompass,
  FaSuitcaseRolling,
  FaHotel,
  FaMapSigns,
  FaUmbrella,
} from "react-icons/fa";

export const ICON_REGISTRY = {
  FaGlobeAmericas,
  FaPlaneDeparture,
  FaUmbrellaBeach,
  FaMountain,
  FaCity,
  FaPlane,
  FaMapMarkedAlt,
  FaFlag,
  FaPassport,
  FaStar,
  FaCompass,
  FaSuitcaseRolling,
  FaHotel,
  FaMapSigns,
  FaUmbrella,
  default: FaPlane,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export const CATEGORY_ICONS = {
  Internacional: FaPlane,
  Nacional: FaGlobeAmericas,
  Playa: FaUmbrellaBeach,
  Montaña: FaMountain,
  "Monta�a": FaMountain,
  Ciudad: FaCity,
  Aventura: FaCompass,
  Lujo: FaStar,
  Familiar: FaSuitcaseRolling,
  Naturaleza: FaMapMarkedAlt,
  Otros: FaPlane,
};

export function getSafeIcon(iconName) {
  if (!iconName) return ICON_REGISTRY.default;

  const normalized = iconName.toString().trim();
  return CATEGORY_ICONS[normalized] || ICON_REGISTRY[normalized] || ICON_REGISTRY.default;
}
