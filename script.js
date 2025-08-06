// Inicializando o mapa
var mapa = L.map('mapa').setView([-29.684, -51.142], 12);  // Coordenadas iniciais do RS

// Adicionando a camada base do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapa);

// Criando o controle de geocoder (barra de pesquisa)
var control = L.Control.Geocoder.nominatim({
    position: 'topright',  // Posição do controle de busca
    placeholder: 'Digite o nome da cidade ou local...',  // Texto do placeholder
    suggestMinLength: 3  // Iniciar sugestões após 3 caracteres
}).addTo(mapa);

// Função de pesquisa: quando um local é encontrado, mover o mapa e adicionar marcador
control.on('markgeocode', function(event) {
    var latlng = event.geocode.center;
    mapa.setView(latlng, 12);  // Zoom para a localização encontrada
    L.marker(latlng).addTo(mapa).bindPopup('Localização encontrada').openPopup();
});
