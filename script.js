// ============================================================
//  DADOS DOS PONTOS DE RISCO
//  Para adicionar novos pontos, basta inserir mais objetos aqui.
// ============================================================
const pontosRisco = [
  {
    nome: "Porto Alegre — Bairro Sarandi",
    lat: -29.999,
    lng: -51.147,
    risco: "alto",
    descricao: "Área com histórico de alagamentos severos em chuvas acima de 80mm/h. Proximidade com o Arroio Feijó."
  },
  {
    nome: "São Leopoldo — Centro",
    lat: -29.760,
    lng: -51.148,
    risco: "alto",
    descricao: "Margem do Rio dos Sinos com risco crítico de transbordamento durante períodos de chuva intensa."
  },
  {
    nome: "Canoas — Bairro Mathias Velho",
    lat: -29.920,
    lng: -51.183,
    risco: "medio",
    descricao: "Área de várzea com alagamentos frequentes. Infraestrutura de drenagem insuficiente."
  },
  {
    nome: "Novo Hamburgo — Margem do Rio dos Sinos",
    lat: -29.678,
    lng: -51.130,
    risco: "medio",
    descricao: "Proximidade com o leito do rio; nível monitorado em tempo real pela SEMA."
  },
  {
    nome: "Sapucaia do Sul — Bairro Industrial",
    lat: -29.831,
    lng: -51.152,
    risco: "baixo",
    descricao: "Monitoramento preventivo de drenagem urbana. Sem ocorrências recentes de alagamento."
  }
];

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let marcadores = []; // array de { layer, ponto, visivel }
let mapa;

// ============================================================
//  CORES POR NÍVEL DE RISCO
// ============================================================
const CORES = {
  alto:  '#f43f5e',
  medio: '#fbbf24',
  baixo: '#34d399'
};

// ============================================================
//  ÍCONE CUSTOMIZADO (círculo colorido com ripple animado)
// ============================================================
function criarIcone(risco) {
  const cor = CORES[risco] || '#38bdf8';
  return L.divIcon({
    html: `
      <div style="
        width: 20px; height: 20px;
        background: ${cor};
        border: 3px solid rgba(255,255,255,0.9);
        border-radius: 50%;
        box-shadow: 0 0 10px ${cor}, 0 0 20px ${cor}44;
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid ${cor}44;
          animation: ripple 2s ease-out infinite;
        "></div>
      </div>
      <style>
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      </style>
    `,
    className: '',
    iconSize:    [20, 20],
    iconAnchor:  [10, 10],
    popupAnchor: [0, -14]
  });
}

// ============================================================
//  HTML INTERNO DO POPUP
// ============================================================
function popupHTML(ponto) {
  const labels = { alto: 'Risco Alto', medio: 'Risco Médio', baixo: 'Risco Baixo' };
  return `
    <div class="popup-inner">
      <h3>${ponto.nome}</h3>
      <span class="popup-badge ${ponto.risco}">${labels[ponto.risco]}</span>
      <p>${ponto.descricao}</p>
    </div>
  `;
}

// ============================================================
//  INICIALIZAR MAPA
// ============================================================
function initMap() {
  mapa = L.map('mapa', {
    zoomControl: false,       // zoom customizado abaixo
    attributionControl: true
  }).setView([-29.75, -51.15], 10);

  // Tile layer escuro (CartoCDN dark)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapa);

  // Controle de zoom no canto inferior esquerdo
  L.control.zoom({ position: 'bottomleft' }).addTo(mapa);

  setupGeocoder();
  criarMarcadores();
  renderizarLista();
}

// ============================================================
//  GEOCODER (barra de busca de endereços)
// ============================================================
function setupGeocoder() {
  L.Control.geocoder({
    defaultMarkGeocode: false,
    position: 'topright',
    placeholder: 'Buscar cidade ou local...',
    geocoder: L.Control.Geocoder.nominatim()
  })
  .on('markgeocode', function(e) {
    const latlng = e.geocode.center;
    mapa.setView(latlng, 13);
    L.marker(latlng, { icon: criarIcone('baixo') })
      .addTo(mapa)
      .bindPopup(`<div class="popup-inner"><h3>Local encontrado</h3><p>${e.geocode.name}</p></div>`)
      .openPopup();
  })
  .addTo(mapa);
}

// ============================================================
//  CRIAR MARCADORES no mapa a partir do array pontosRisco
// ============================================================
function criarMarcadores() {
  // Remove marcadores anteriores (caso seja chamada novamente)
  marcadores.forEach(m => mapa.removeLayer(m.layer));
  marcadores = [];

  pontosRisco.forEach((ponto) => {
    const layer = L.marker([ponto.lat, ponto.lng], { icon: criarIcone(ponto.risco) })
      .addTo(mapa)
      .bindPopup(popupHTML(ponto), { maxWidth: 240 });

    marcadores.push({ layer, ponto, visivel: true });
  });
}

// ============================================================
//  FILTRAR MARCADORES por nível de risco (checkboxes da sidebar)
// ============================================================
function aplicarFiltros() {
  const ativos = {
    alto:  document.getElementById('f-alto').checked,
    medio: document.getElementById('f-medio').checked,
    baixo: document.getElementById('f-baixo').checked
  };

  marcadores.forEach(m => {
    if (ativos[m.ponto.risco]) {
      if (!mapa.hasLayer(m.layer)) mapa.addLayer(m.layer);
      m.visivel = true;
    } else {
      if (mapa.hasLayer(m.layer)) mapa.removeLayer(m.layer);
      m.visivel = false;
    }
  });

  renderizarLista(ativos);
}

// ============================================================
//  RENDERIZAR LISTA DE PONTOS na sidebar
// ============================================================
function renderizarLista(ativos) {
  ativos = ativos || { alto: true, medio: true, baixo: true };

  const container = document.getElementById('points-list');
  container.innerHTML = '';

  const labels = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };

  pontosRisco.forEach((ponto, i) => {
    if (!ativos[ponto.risco]) return;

    const div = document.createElement('div');
    div.className = 'point-item';
    div.innerHTML = `
      <div class="point-indicator ${ponto.risco}"></div>
      <div class="point-info">
        <div class="point-name">${ponto.nome}</div>
        <div class="point-desc">${ponto.descricao}</div>
      </div>
      <span class="point-risk-badge ${ponto.risco}">${labels[ponto.risco]}</span>
    `;

    // Ao clicar no item da lista, centraliza o mapa e abre o popup
    div.addEventListener('click', () => {
      mapa.setView([ponto.lat, ponto.lng], 14, { animate: true });
      marcadores[i].layer.openPopup();
    });

    container.appendChild(div);
  });
}

// ============================================================
//  GEOLOCALIZAÇÃO — botão "Minha Localização"
// ============================================================
function minhaLocalizacao() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada neste navegador.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      mapa.setView(latlng, 13, { animate: true });
      L.marker(latlng, { icon: criarIcone('baixo') })
        .addTo(mapa)
        .bindPopup('<div class="popup-inner"><h3>Você está aqui</h3><p>Localização atual do dispositivo.</p></div>')
        .openPopup();
    },
    function() {
      alert('Não foi possível obter a localização.');
    }
  );
}

// ============================================================
//  INICIAR após o DOM carregar
// ============================================================
window.addEventListener('DOMContentLoaded', initMap);
