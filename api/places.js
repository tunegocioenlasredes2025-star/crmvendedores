// ============================================================
// CRM Tu Negocio En Las Redes — Importar prospecto desde Google Maps
// Función serverless de Vercel (se ejecuta en el servidor, NO en el navegador).
// La API key vive en una variable de entorno de Vercel: GOOGLE_MAPS_API_KEY
// Nunca se expone al frontend.
//
// Uso:  GET /api/places?url=<link de Google Maps>
// Devuelve: { nombre, rubro, direccion, ciudad, provincia, telefono, sitio_web, lat, lng, fuente }
// ============================================================

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// --- Expande links cortos (maps.app.goo.gl, goo.gl/maps, g.co) al URL final ---
async function expandUrl(url){
  try{
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, 'Accept-Language': 'es-AR,es;q=0.9' } });
    let finalUrl = res.url || url;
    // Si quedó en una página de consentimiento, intentar recuperar el destino real.
    if(/consent\.(google|youtube)\.com|sorry\/index/i.test(finalUrl)){
      try{
        const u = new URL(finalUrl);
        const cont = u.searchParams.get('continue');
        if(cont) finalUrl = decodeURIComponent(cont);
      }catch(_){}
    }
    // Si todavía no tenemos un /place/, mirar el cuerpo HTML por una URL canónica.
    if(!/\/maps\/place\//.test(finalUrl)){
      const body = await res.text().catch(()=> '');
      const m = body.match(/https?:\/\/www\.google\.[^"'\\]+\/maps\/place\/[^"'\\]+/);
      if(m) finalUrl = m[0];
    }
    return finalUrl;
  }catch(_){
    return url;
  }
}

// --- Saca nombre del negocio y coordenadas del URL de Google Maps ---
function parseMapsUrl(url){
  const out = { name: '', lat: null, lng: null };
  try{
    // Nombre:  /maps/place/<NOMBRE>/...
    const place = url.match(/\/maps\/place\/([^/@]+)/);
    if(place){
      let n = decodeURIComponent(place[1].replace(/\+/g, ' ')).trim();
      if(n && !/^@/.test(n) && !/^-?\d+\.\d+,/.test(n)) out.name = n;
    }
    // Coordenadas exactas del negocio:  !3d<lat>!4d<lng>
    let c = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    // o el centro del mapa:  @<lat>,<lng>
    if(!c) c = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if(c){ out.lat = parseFloat(c[1]); out.lng = parseFloat(c[2]); }
    // ?q=  /  ?query=  pueden traer el nombre o coordenadas
    const u = new URL(url);
    const q = u.searchParams.get('q') || u.searchParams.get('query') || '';
    if(q){
      const qc = q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if(qc){ if(out.lat==null){ out.lat=parseFloat(qc[1]); out.lng=parseFloat(qc[2]); } }
      else if(!out.name) out.name = q.trim();
    }
  }catch(_){}
  return out;
}

// --- Saca ciudad y provincia de los addressComponents (Places API New) ---
function extractLocality(components){
  const res = { ciudad: '', provincia: '' };
  if(!Array.isArray(components)) return res;
  const byType = (t)=> components.find(c => (c.types||[]).includes(t));
  const city = byType('locality') || byType('postal_town') || byType('administrative_area_level_2') || byType('sublocality_level_1') || byType('sublocality');
  const prov = byType('administrative_area_level_1');
  if(city) res.ciudad = city.longText || city.shortText || '';
  if(prov) res.provincia = prov.longText || prov.shortText || '';
  return res;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if(!key){
    res.status(500).json({ error: 'Falta configurar GOOGLE_MAPS_API_KEY en Vercel.' });
    return;
  }
  const url = (req.query && req.query.url) ? String(req.query.url).trim() : '';
  if(!url || !/^https?:\/\//i.test(url)){
    res.status(400).json({ error: 'Pegá un link válido de Google Maps.' });
    return;
  }

  try{
    const finalUrl = await expandUrl(url);
    const { name, lat, lng } = parseMapsUrl(finalUrl);

    if(!name && lat == null){
      res.status(422).json({ error: 'No reconocí el link. Usá el botón "Compartir" del negocio en Google Maps y pegá ese link.' });
      return;
    }

    // Búsqueda en Places API (New). Sesga por ubicación para acertar el negocio exacto.
    const body = {
      textQuery: name || `${lat},${lng}`,
      languageCode: 'es',
      regionCode: 'AR',
      maxResultCount: 1
    };
    if(lat != null && lng != null){
      body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 250.0 } };
    }

    const fieldMask = [
      'places.displayName',
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.location',
      'places.primaryTypeDisplayName',
      'places.types',
      'places.addressComponents'
    ].join(',');

    const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(body)
    });

    const data = await gRes.json().catch(()=> ({}));
    if(!gRes.ok){
      const msg = (data && data.error && data.error.message) ? data.error.message : 'Error consultando Google Places.';
      res.status(502).json({ error: 'Google Places: ' + msg });
      return;
    }

    const p = data.places && data.places[0];
    if(!p){
      res.status(404).json({ error: 'No se encontró el negocio en Google. Revisá el link o cargá los datos a mano.' });
      return;
    }

    const loc = extractLocality(p.addressComponents);
    const telefono = (p.nationalPhoneNumber || p.internationalPhoneNumber || '').trim();
    const result = {
      nombre: (p.displayName && p.displayName.text) || name || '',
      rubro: (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || (Array.isArray(p.types) && p.types[0] ? p.types[0].replace(/_/g, ' ') : ''),
      direccion: p.formattedAddress || '',
      ciudad: loc.ciudad,
      provincia: loc.provincia,
      telefono,
      sitio_web: p.websiteUri || '',
      lat: p.location ? p.location.latitude : lat,
      lng: p.location ? p.location.longitude : lng,
      fuente: 'Google Maps'
    };

    res.status(200).json(result);
  }catch(err){
    res.status(500).json({ error: 'No se pudo procesar el link: ' + (err && err.message ? err.message : 'error inesperado') });
  }
};
