-- ============================================================
-- calcular_distancia.sql
-- Calcula distância em km entre dois pontos (Haversine)
-- Uso: SELECT calcular_distancia(lat1, lng1, lat2, lng2);
-- Preparada para quando adicionarmos geolocalização
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_distancia(
  lat1 FLOAT, lng1 FLOAT,
  lat2 FLOAT, lng2 FLOAT
)
RETURNS FLOAT AS $$
DECLARE
  r      FLOAT := 6371;   -- raio da Terra em km
  dlat   FLOAT;
  dlng   FLOAT;
  a      FLOAT;
  c      FLOAT;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);

  a := SIN(dlat / 2) ^ 2
     + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng / 2) ^ 2;

  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));

  RETURN ROUND((r * c)::NUMERIC, 2);  -- resultado em km com 2 casas decimais
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Exemplo de uso futuro (quando usuarios tiver lat/lng):
-- SELECT u.nome, calcular_distancia(-23.55, -46.63, u.lat, u.lng) AS distancia_km
-- FROM usuarios u WHERE u.modo = 'worker'
-- ORDER BY distancia_km ASC LIMIT 10;

COMMENT ON FUNCTION calcular_distancia IS
  'Fórmula de Haversine — distância em km entre dois pontos geográficos. '
  'Será usada para ordenar trabalhadores por proximidade.';

-- Alias histórico mantido para bancos e integrações antigas.
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT, lng1 FLOAT,
  lat2 FLOAT, lng2 FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  RETURN calcular_distancia(lat1, lng1, lat2, lng2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
