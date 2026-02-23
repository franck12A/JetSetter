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

// ------------------------------------------------------------------
// REGISTRO GENERAL DE ICONOS
// String -> componente
// ------------------------------------------------------------------
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

  // Fallback universal
  default: FaPlane,
};

// Lista de nombres de iconos
export const ICON_NAMES = Object.keys(ICON_REGISTRY);

// ------------------------------------------------------------------
// MAPEOS DE CATEGORÍAS A ICONOS
// ------------------------------------------------------------------
export const CATEGORY_ICONS = {
  Internacional: FaPlane,
  Nacional: FaGlobeAmericas,
  Playa: FaUmbrellaBeach,
  Montaña: FaMountain,
  Ciudad: FaCity,
  Otros: FaPlane, // fallback para categorías no definidas
};

// ------------------------------------------------------------------
// FUNCIÓN SEGURO TOTAL
// Nunca rompe aunque venga null, undefined, vacío o inválido
// ------------------------------------------------------------------
export function getSafeIcon(iconName) {
  if (!iconName) return ICON_REGISTRY.default;

  const normalized = iconName.toString().trim();

  // Primero revisa CATEGORY_ICONS, si no existe usa ICON_REGISTRY
  return CATEGORY_ICONS[normalized] || ICON_REGISTRY[normalized] || ICON_REGISTRY.default;
}
