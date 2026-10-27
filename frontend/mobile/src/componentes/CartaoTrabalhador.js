import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { usarTema } from '../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../tema/tipografia';
import { Card, Avatar, AvaliacaoEstrelas, Badge } from './interface';
import Icon from './Gravacao';
import { iconForCategory } from '../utilitarios/iconesCategorias';

// memo() evita re-renderizar cada card quando a LISTA muda mas aquele worker específico não mudou (ex.: favoritar um item não deveria re-renderizar o...
export const CartaoTrabalhador = memo(function CartaoTrabalhador({ worker, onPress, onFavorite, isFavorite }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress}>
      <Card style={{ marginBottom: 12, flexDirection: 'row', gap: 12 }}>
        <Avatar uri={worker.url_avatar} nome={worker.nome} size={56} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text }} numberOfLines={1}>
              {worker.nome}
            </Text>
            {onFavorite && (
              <Pressable onPress={onFavorite} hitSlop={8}>
                <Icon nome="heart" filled={isFavorite} size={18} color={isFavorite ? theme.brand.danger : theme.line} />
              </Pressable>
            )}
          </View>
          {!!worker.nome_categoria && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <Icon nome={iconForCategory(worker.categoria_slug)} size={13} color={theme.brand.orange} />
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                {worker.nome_categoria}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
            <AvaliacaoEstrelas value={Number(worker.media_avaliacao)} count={worker.total_avaliacoes} size={13} />
            {typeof worker.distance_km === 'number' && (
              <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted }}>
                {worker.distance_km} km
              </Text>
            )}
          </View>
          <Badge
            label={worker.esta_disponivel ? 'Disponível' : 'Indisponível'}
            kind={worker.esta_disponivel ? 'green' : 'slate'}
            style={{ marginTop: 8 }}
          />
        </View>
      </Card>
    </Pressable>
  );
});

export const CategoryChip = memo(function CategoryChip({ category, selected, onPress }) {
  const { theme, rs } = usarTema();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          marginRight: 8,
          backgroundColor: selected ? theme.brand.orange : theme.bgAlt,
          borderWidth: 1,
          borderColor: selected ? theme.brand.orange : theme.cardBorder,
        }}
      >
        <Icon nome={iconForCategory(category.slug)} size={15} color={selected ? '#fff' : theme.textMuted} />
        <Text
          style={{
            fontFamily: FONTES.bodyMedium,
            fontSize: rs(TAMANHOS.sm),
            color: selected ? '#fff' : theme.text,
          }}
        >
          {category.nome}
        </Text>
      </View>
    </Pressable>
  );
});
