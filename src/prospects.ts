export interface Prospect {
  id: number;
  nombre: string;
  telefono: string | null;
  instagram: string | null;
  web: string | null;
  rubro: string;
  rubroSlug: string;
}

// Rubros con alta afinidad al Kit Live Commerce (TikTok Live)
export const KIT_RUBROS = [
  "ropa", "zapaterias", "joyerias", "decoracion", "deportes",
  "heladerias", "florerias", "tecnologia", "cafeterias", "restaurantes"
];

// Rubros con mayor afinidad a plan de marketing o agente AI
export const MARKETING_RUBROS = [
  "peluquerias", "esteticas", "veterinarias", "gimnasios", "fotografia", "cerrajerias"
];

export function getRubroFit(rubroSlug: string): "kit" | "marketing" | "ambos" {
  if (KIT_RUBROS.includes(rubroSlug)) return "kit";
  if (MARKETING_RUBROS.includes(rubroSlug)) return "marketing";
  return "ambos";
}

export const PROSPECTS: Prospect[] = [
  // ROPA
  { id: 1, nombre: "Outlet Pueblo de Ropa", telefono: "5492614231324", instagram: "@outletpuebloderopa", web: null, rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 2, nombre: "EVA MORENA Showroom", telefono: "5492616393914", instagram: null, web: "evamorena.com", rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 3, nombre: "Tiendas Balbi Mendoza", telefono: "5492614255770", instagram: null, web: null, rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 4, nombre: "Distribuidora gonzi", telefono: "5492615614976", instagram: "@casagonzi", web: null, rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 5, nombre: "Weloveanana", telefono: "5492617068220", instagram: null, web: "weloveanana.com", rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 6, nombre: "La Feriaa De La Ropa", telefono: "5492612508826", instagram: null, web: null, rubro: "Tienda de Ropa", rubroSlug: "ropa" },
  { id: 7, nombre: "Le Utthe", telefono: "5492616346996", instagram: null, web: "leutthe.com", rubro: "Tienda de Ropa", rubroSlug: "ropa" },

  // ZAPATERIAS
  { id: 8, nombre: "Calzados Salamone Córdoba", telefono: "5492614340020", instagram: null, web: "calzadossalamone.com", rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 9, nombre: "Calzados Salamone Las Heras", telefono: "5492614232809", instagram: null, web: "calzadossalamone.com", rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 10, nombre: "Calzados El Campeón", telefono: "5492614232035", instagram: null, web: null, rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 11, nombre: "Calzados José Luis", telefono: "5492614255560", instagram: null, web: "calzadosjoseluis.com.ar", rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 12, nombre: "Og Calzados", telefono: "5492614298585", instagram: null, web: "ogcalzados.com", rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 13, nombre: "Via Victoria Zapatos", telefono: "5492614297770", instagram: null, web: "viavictoriazapatos.com.ar", rubro: "Zapatería", rubroSlug: "zapaterias" },
  { id: 14, nombre: "Zapatería Don Carlos", telefono: "5492616404603", instagram: null, web: null, rubro: "Zapatería", rubroSlug: "zapaterias" },

  // CAFETERIAS
  { id: 15, nombre: "The Mood", telefono: "5492613735495", instagram: "@themood.cafebar", web: null, rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 16, nombre: "Vicentica Cafeteria", telefono: "5492613384973", instagram: null, web: null, rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 17, nombre: "Fran Coffee Makers", telefono: "5492616836993", instagram: null, web: "francoffeemakers.com.ar", rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 18, nombre: "Christopher St.", telefono: "5492615155300", instagram: null, web: null, rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 19, nombre: "MUCHO café Mendoza", telefono: "5492617003657", instagram: "@muchocafe.ar", web: null, rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 20, nombre: "Cabrita Garage Café", telefono: "5492617176679", instagram: null, web: null, rubro: "Cafetería", rubroSlug: "cafeterias" },
  { id: 21, nombre: "Delis Cafe Vintage Shop", telefono: "5492611157252604", instagram: null, web: "delisvintageshop.com", rubro: "Cafetería", rubroSlug: "cafeterias" },

  // RESTAURANTES
  { id: 22, nombre: "El Faro Bistro Mendoza", telefono: "5492612068834", instagram: "@elfarobistro", web: null, rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 23, nombre: "Los Laureles", telefono: "5492616240002", instagram: "@los___laureles", web: null, rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 24, nombre: "Anna Bistró", telefono: "5492614251818", instagram: null, web: "annabistro.com.ar", rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 25, nombre: "Carolino Cocina", telefono: "5492613333518", instagram: null, web: "carolinococina.ar", rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 26, nombre: "La Central Vermutería", telefono: "5492612765334", instagram: null, web: null, rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 27, nombre: "Estancia La Pasión", telefono: "5492616694496", instagram: null, web: null, rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 28, nombre: "Mar y Monte", telefono: "5492617221601", instagram: null, web: "marymonte.com.ar", rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 29, nombre: "Chama santuario", telefono: "5492615010320", instagram: null, web: "chamasantuario.com", rubro: "Restaurante", rubroSlug: "restaurantes" },
  { id: 30, nombre: "El asadito bodegon", telefono: "5492611155029744", instagram: null, web: null, rubro: "Restaurante", rubroSlug: "restaurantes" },

  // PELUQUERIAS
  { id: 31, nombre: "Adrián Díaz Estilistas", telefono: "5492614205270", instagram: null, web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 32, nombre: "Peluquería Italia", telefono: "5492613212200", instagram: "@peluitalia259", web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 33, nombre: "Peluquería Ibañez Gloss", telefono: "5492612588446", instagram: "@ibanezgloss", web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 34, nombre: "Facundo Sebastianelli", telefono: "5492615532270", instagram: "@fspeluqueros", web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 35, nombre: "Deeelite Estilistas", telefono: "5492614380202", instagram: null, web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 36, nombre: "Bari peluquería", telefono: "5492613331617", instagram: null, web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 37, nombre: "Hair equipe", telefono: "5492615988579", instagram: null, web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },
  { id: 38, nombre: "Peluqueria perfiles", telefono: "5492615186449", instagram: null, web: null, rubro: "Peluquería", rubroSlug: "peluquerias" },

  // GIMNASIOS
  { id: 39, nombre: "Gimnasio Cigma", telefono: "5492614238985", instagram: null, web: "gimnasiocigma.com.ar", rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 40, nombre: "PRO-FORM GIMNASIOS", telefono: "5492612628929", instagram: null, web: "gimnasiosproform.com.ar", rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 41, nombre: "LEVELGYM PIAZZA", telefono: "5492612723963", instagram: "@levelgym.mendoza", web: null, rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 42, nombre: "Centro Urbano De Entrenamiento", telefono: "5492616945802", instagram: "@centrourbanode", web: null, rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 43, nombre: "Griego Fitness Center", telefono: "5492615745300", instagram: null, web: "griegofitnesscenter.com.ar", rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 44, nombre: "Gimnasio En Ritmo", telefono: "5492616975525", instagram: "@en.ritmo", web: null, rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 45, nombre: "Gimnasio GEMZA", telefono: "5492615412897", instagram: "@gimnasiogemza", web: null, rubro: "Gimnasio", rubroSlug: "gimnasios" },
  { id: 46, nombre: "PRO-FORM CENTER", telefono: "5492615755536", instagram: null, web: "gimnasiosproform.com.ar", rubro: "Gimnasio", rubroSlug: "gimnasios" },

  // JOYERIAS
  { id: 47, nombre: "Eduardo Vendemmia Joyas", telefono: "5492614233053", instagram: null, web: "eduardovendemmiajoyas.com", rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 48, nombre: "Joyería Santiago", telefono: "5492617769999", instagram: null, web: null, rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 49, nombre: "Castellani Joyería", telefono: "5492616637887", instagram: null, web: "castellanijoyeria.com", rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 50, nombre: "LE CADRAN", telefono: "5492615351800", instagram: null, web: "lecadranjoyas.empretienda.com.ar", rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 51, nombre: "LEYSA", telefono: "5492616182581", instagram: null, web: "leysa.ar", rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 52, nombre: "Joyeria Fils", telefono: "5492614235818", instagram: null, web: null, rubro: "Joyería", rubroSlug: "joyerias" },
  { id: 53, nombre: "Joyeria Sancy", telefono: "5492614205141", instagram: null, web: null, rubro: "Joyería", rubroSlug: "joyerias" },

  // OPTICAS
  { id: 54, nombre: "Centroptica Mendoza", telefono: "5492615562029", instagram: null, web: "centropticamendoza.empretienda.com.ar", rubro: "Óptica", rubroSlug: "opticas" },
  { id: 55, nombre: "OPTICA MENDOZA", telefono: "5492615144107", instagram: null, web: null, rubro: "Óptica", rubroSlug: "opticas" },
  { id: 56, nombre: "Optica central", telefono: "5492614200088", instagram: null, web: null, rubro: "Óptica", rubroSlug: "opticas" },
  { id: 57, nombre: "Optica Zuñiga", telefono: "5492613005087", instagram: "@zunigaoptica", web: null, rubro: "Óptica", rubroSlug: "opticas" },
  { id: 58, nombre: "Óptica Salguero", telefono: "5492614254896", instagram: null, web: "opticasalguero.com.ar", rubro: "Óptica", rubroSlug: "opticas" },
  { id: 59, nombre: "OPTICA SCERBO", telefono: "5492614251212", instagram: null, web: "scerboptica.com", rubro: "Óptica", rubroSlug: "opticas" },
  { id: 60, nombre: "OPTICAL SHOP", telefono: "5492616290490", instagram: null, web: "opticalshopmza.com.ar", rubro: "Óptica", rubroSlug: "opticas" },
  { id: 61, nombre: "La Pirámide Óptica", telefono: "5492614258569", instagram: null, web: "lapiramideopticas.com", rubro: "Óptica", rubroSlug: "opticas" },

  // HELADERIAS
  { id: 62, nombre: "Angolo Dolce", telefono: "5492613449415", instagram: null, web: null, rubro: "Heladería", rubroSlug: "heladerias" },
  { id: 63, nombre: "Heladería Chini", telefono: "5492615140625", instagram: "@heladoschini.ok", web: null, rubro: "Heladería", rubroSlug: "heladerias" },
  { id: 64, nombre: "Ferruccio Soppelsa", telefono: "5492613488200", instagram: "@soppelsahelados", web: null, rubro: "Heladería", rubroSlug: "heladerias" },
  { id: 65, nombre: "Reggi Gelatería", telefono: "5492617748574", instagram: "@reggigelato", web: null, rubro: "Heladería", rubroSlug: "heladerias" },
  { id: 66, nombre: "Alma de Helado", telefono: "5492613407490", instagram: null, web: null, rubro: "Heladería", rubroSlug: "heladerias" },
  { id: 67, nombre: "Helados Lomoro", telefono: "5492611158016270", instagram: null, web: "heladoslomoro.com.ar", rubro: "Heladería", rubroSlug: "heladerias" },

  // FLORERIAS
  { id: 68, nombre: "Florería Las Princesas", telefono: "5492617482422", instagram: null, web: null, rubro: "Florería", rubroSlug: "florerias" },
  { id: 69, nombre: "Flores Paula", telefono: "5492615150870", instagram: null, web: "florespaula.com.ar", rubro: "Florería", rubroSlug: "florerias" },
  { id: 70, nombre: "Flores Luna", telefono: "5492615979395", instagram: null, web: "floresluna.com.ar", rubro: "Florería", rubroSlug: "florerias" },
  { id: 71, nombre: "Flores Meryland", telefono: "5492614295944", instagram: null, web: "floresmeryland.com", rubro: "Florería", rubroSlug: "florerias" },
  { id: 72, nombre: "Floreria San Jerónimo", telefono: "5492614187468", instagram: null, web: null, rubro: "Florería", rubroSlug: "florerias" },
  { id: 73, nombre: "Floreria Mia", telefono: "5492616163475", instagram: null, web: null, rubro: "Florería", rubroSlug: "florerias" },
  { id: 74, nombre: "Florería Noelia", telefono: "5492617677123", instagram: null, web: null, rubro: "Florería", rubroSlug: "florerias" },
  { id: 75, nombre: "Floreria Jazmin", telefono: "5492615951162", instagram: "@floreriajazmin2025", web: null, rubro: "Florería", rubroSlug: "florerias" },

  // DECORACION
  { id: 76, nombre: "Mi Casa Decoraciones", telefono: "5492612061082", instagram: null, web: "micasadecoraciones.com", rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 77, nombre: "Acasa Tienda", telefono: "5492615781317", instagram: null, web: "acasatienda.com.ar", rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 78, nombre: "SIMPLY Deco+Design", telefono: "5492614200806", instagram: null, web: "simply.com.ar", rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 79, nombre: "La Provenza", telefono: "5492615651433", instagram: null, web: "laprovenzadeco.com.ar", rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 80, nombre: "Deco Mendoza", telefono: "5492612490083", instagram: "@deco_mendoza", web: null, rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 81, nombre: "Vivant la vie", telefono: "5492615518674", instagram: null, web: "vivantlavie.com.ar", rubro: "Decoración", rubroSlug: "decoracion" },
  { id: 82, nombre: "Gamma Hogar", telefono: "5492614152613", instagram: null, web: "gammahogar.com.ar", rubro: "Decoración", rubroSlug: "decoracion" },

  // TECNOLOGIA
  { id: 83, nombre: "KCT Argentina", telefono: "5492614294069", instagram: null, web: "kctargentina.com", rubro: "Tecnología", rubroSlug: "tecnologia" },
  { id: 84, nombre: "AyP Computacion", telefono: "5492616012099", instagram: null, web: "aypcomputacion.com", rubro: "Tecnología", rubroSlug: "tecnologia" },
  { id: 85, nombre: "TiendaOP", telefono: "5492612592084", instagram: null, web: "tiendaop.com.ar", rubro: "Tecnología", rubroSlug: "tecnologia" },
  { id: 86, nombre: "Infoar Computación", telefono: "5492617493577", instagram: null, web: "infoarcomputacion.com.ar", rubro: "Tecnología", rubroSlug: "tecnologia" },
  { id: 87, nombre: "Gaming City Mendoza", telefono: "5492613998443", instagram: "@gamingcitymendoza", web: null, rubro: "Tecnología", rubroSlug: "tecnologia" },
  { id: 88, nombre: "On Site Net Computación", telefono: "5492616907529", instagram: null, web: "onsitenet.com.ar", rubro: "Tecnología", rubroSlug: "tecnologia" },

  // DEPORTES
  { id: 89, nombre: "CIGMA deportes", telefono: "5492611153835353", instagram: "@cigmadeportes", web: null, rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 90, nombre: "Crack's Sport", telefono: "5492614258742", instagram: "@cracksmza", web: null, rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 91, nombre: "re•USE deportes", telefono: "5492615003948", instagram: null, web: "reusedeportes.com", rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 92, nombre: "Sportotal", telefono: "5492614254521", instagram: null, web: "sportotal.com.ar", rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 93, nombre: "VIM SPORT", telefono: "5492612548396", instagram: null, web: "vimsport.mitiendanube.com", rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 94, nombre: "Sporting", telefono: "5492614238560", instagram: null, web: "sporting.com.ar", rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },
  { id: 95, nombre: "Futbolero Ciudad", telefono: "5492613470283", instagram: null, web: "futbolero.com.ar", rubro: "Indumentaria Deportiva", rubroSlug: "deportes" },

  // ESTETICAS
  { id: 96, nombre: "SYMI Estética Centro", telefono: "5492612510012", instagram: null, web: null, rubro: "Estética", rubroSlug: "esteticas" },
  { id: 97, nombre: "ELA Estetica Integral", telefono: "5492617254482", instagram: null, web: null, rubro: "Estética", rubroSlug: "esteticas" },
  { id: 98, nombre: "Mylha estética", telefono: "5492615584349", instagram: null, web: null, rubro: "Estética", rubroSlug: "esteticas" },
  { id: 99, nombre: "Liebe Estética", telefono: "5492614707678", instagram: null, web: null, rubro: "Estética", rubroSlug: "esteticas" },
  { id: 100, nombre: "Zonestetic", telefono: "5492612440921", instagram: null, web: "zonestetic.com", rubro: "Estética", rubroSlug: "esteticas" },
  { id: 101, nombre: "Elith Estetica", telefono: "5492616794025", instagram: null, web: null, rubro: "Estética", rubroSlug: "esteticas" },

  // VETERINARIAS
  { id: 102, nombre: "Veterinaria del Centro", telefono: "5492612515230", instagram: "@vetdelcentro.mza", web: null, rubro: "Veterinaria", rubroSlug: "veterinarias" },
  { id: 103, nombre: "Camila Vet y Tienda Mascotas", telefono: "5492616937869", instagram: null, web: null, rubro: "Veterinaria", rubroSlug: "veterinarias" },
  { id: 104, nombre: "Veterinaria San Roque", telefono: "5492615124566", instagram: null, web: "sanroqueveterinaria.com", rubro: "Veterinaria", rubroSlug: "veterinarias" },
  { id: 105, nombre: "VETERINARIA GREENVET", telefono: "5492612133343", instagram: null, web: "greenvet.com.ar", rubro: "Veterinaria", rubroSlug: "veterinarias" },
  { id: 106, nombre: "Dr. Juan Martin Molinari", telefono: "5492615183703", instagram: "@drjuanmartinmolinari", web: null, rubro: "Veterinaria", rubroSlug: "veterinarias" },

  // FOTOGRAFIA
  { id: 107, nombre: "Matías Rosso Fotógrafo", telefono: "5492631154521428", instagram: null, web: "matiasrosso.com", rubro: "Fotografía", rubroSlug: "fotografia" },
  { id: 108, nombre: "Foto Charles", telefono: "5492613360938", instagram: null, web: null, rubro: "Fotografía", rubroSlug: "fotografia" },
  { id: 109, nombre: "FOTO RAMBLA", telefono: "5492615193104", instagram: null, web: null, rubro: "Fotografía", rubroSlug: "fotografia" },
  { id: 110, nombre: "Aureo Studio", telefono: "5492612517975", instagram: null, web: "aureo-studio.com", rubro: "Fotografía", rubroSlug: "fotografia" },
  { id: 111, nombre: "Fotoprint Revelado Digital", telefono: "5492614253696", instagram: null, web: "fotoprintmendoza.com", rubro: "Fotografía", rubroSlug: "fotografia" },

  // CERRAJERIAS
  { id: 112, nombre: "Cerrajería Bustamante", telefono: "5492611156572199", instagram: null, web: "cerrajeriabustamantemendoza.com.ar", rubro: "Cerrajería", rubroSlug: "cerrajerias" },
  { id: 113, nombre: "CERRAJERIA JOPIA", telefono: "5492614239527", instagram: null, web: null, rubro: "Cerrajería", rubroSlug: "cerrajerias" },
  { id: 114, nombre: "CERRAJERIA SALTA", telefono: "5492615458914", instagram: null, web: null, rubro: "Cerrajería", rubroSlug: "cerrajerias" },
  { id: 115, nombre: "Cerrajeria suipacha", telefono: "5492613905051", instagram: null, web: null, rubro: "Cerrajería", rubroSlug: "cerrajerias" },
  { id: 116, nombre: "Cerrajería Luis Jopia", telefono: "5492615096267", instagram: null, web: "cerrajerialuisjopia.com", rubro: "Cerrajería", rubroSlug: "cerrajerias" },
];

// Solo los que tienen teléfono
export const PROSPECTS_WITH_PHONE = PROSPECTS.filter(p => p.telefono !== null);
