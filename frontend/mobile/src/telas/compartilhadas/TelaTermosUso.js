import React from 'react';
import { Text, View } from 'react-native';
import { usarTema } from '../../tema/ContextoTema';
import { FONTES, TAMANHOS } from '../../tema/tipografia';
import ContenedorTela from '../../componentes/ContenedorTela';

/** * Termos de Uso. Texto único, usado tanto na tela de cadastro (dentro do fluxo, antes de criar a conta) quanto aqui, reaberto a qualquer momento pelo Perfil — ver `TERMS_VERSION... */
export const TERMS_VERSION = '1.0';
export const TERMS_UPDATED_AT = '2026-09-01';

const SECTIONS = [
  {
    titulo: '1. Quem somos e o que é o MoviPay',
    body: `O MoviPay é uma plataforma que conecta pessoas que precisam de um serviço ("clientes") a profissionais independentes que oferecem esses serviços ("trabalhadores"). O MoviPay funciona como um INTERMEDIÁRIO: não somos parte do contrato de prestação de serviço combinado entre cliente e trabalhador, não empregamos os trabalhadores cadastrados e não garantimos a qualidade, prazo ou resultado de nenhum serviço prestado por meio da plataforma.

Uma mesma conta pode atuar como cliente, como trabalhador, ou como as duas coisas (conta híbrida), conforme escolhido no cadastro ou ativado depois pelo próprio usuário.`,
  },
  {
    titulo: '2. Quem pode usar o MoviPay',
    body: `Para criar uma conta de CLIENTE, não há idade mínima além da exigida por lei para contratar — mas a responsabilidade pelo uso da conta e pelos pagamentos realizados é de quem a criou (ou de seu responsável legal, se for o caso).

Para criar ou ativar um perfil de TRABALHADOR, é necessário ter no mínimo 14 (catorze) anos. Entre 14 e 17 anos, o cadastro exige os dados de um responsável legal, que declara autorizar o cadastro e a atuação profissional do menor na plataforma. Essa regra é verificada tanto no aplicativo quanto no servidor, e não pode ser contornada.

Ao se cadastrar, você declara que as informações fornecidas (nome, CPF, data de nascimento, contato) são verdadeiras e atualizadas.`,
  },
  {
    titulo: '3. Pagamentos, comissão e planos',
    body: `Serviços contratados por meio do MoviPay são pagos dentro do aplicativo, via Pix (chave própria da plataforma ou provedor de pagamento integrado). Sobre o valor de cada serviço concluído, o MoviPay retém uma comissão de plataforma (atualmente 15%, podendo ser alterada mediante aviso) antes de repassar o valor líquido ao trabalhador.

O MoviPay oferece planos de assinatura opcionais para trabalhadores (atualmente: Formiga, gratuito; Operária e Rainha, pagos), que ampliam a exposição do perfil nas buscas dentro de limites definidos pela plataforma — a posição na busca também depende de avaliação, proximidade, disponibilidade e completude do perfil, e a assinatura de um plano nunca garante o primeiro lugar nem substitui a relevância desses fatores.

Clientes podem, opcionalmente, pagar um valor adicional para destacar ("melhor divulgação") um pedido de orçamento específico por tempo limitado.

Nenhuma cobrança é confirmada pelo próprio aplicativo — a confirmação de pagamento sempre depende do provedor de pagamento ou de conferência manual pela plataforma.`,
  },
  {
    titulo: '4. Conduta esperada',
    body: `Ao usar o MoviPay, você concorda em: fornecer informações verdadeiras; não publicar, nos Shorts ou em qualquer outra área do aplicativo, conteúdo ilegal, ofensivo, discriminatório, sexualmente explícito ou que exponha indevidamente terceiros; não usar o chat para fins diferentes de combinar ou acompanhar um serviço; não tentar contornar os mecanismos de pagamento e comissão da plataforma para pagamentos que se originaram dentro dela; e respeitar a outra parte (cliente ou trabalhador) durante toda a negociação e execução do serviço.

O MoviPay pode remover conteúdo, suspender ou encerrar contas que violem estas regras, a seu critério, especialmente em casos que envolvam segurança de menores, fraude ou uso indevido de dados de terceiros.`,
  },
  {
    titulo: '5. Dados pessoais',
    body: `O MoviPay coleta e trata dados pessoais (como nome, CPF, endereço, localização aproximada e histórico de uso) na medida necessária para operar a plataforma, processar pagamentos, verificar a idade mínima de trabalhadores e cumprir obrigações legais, em conformidade com a Lei Geral de Proteção de Dados (LGPD). O CPF nunca é exibido por completo a outros usuários — apenas de forma mascarada, quando aplicável.

Dados de responsáveis legais informados no cadastro de menores de idade são usados exclusivamente para essa finalidade.`,
  },
  {
    titulo: '6. Limitação de responsabilidade',
    body: `Por ser um intermediário, o MoviPay não se responsabiliza por danos, prejuízos, atrasos ou má execução de serviços contratados entre clientes e trabalhadores, nem por informações incorretas fornecidas por qualquer das partes. Recomendamos sempre avaliar o histórico e as avaliações de um profissional antes de contratar, e usar o chat e o sistema de pedidos da plataforma para manter um registro da negociação.`,
  },
  {
    titulo: '7. Alterações destes termos',
    body: `Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas dentro do aplicativo. O uso continuado do MoviPay após uma atualização implica concordância com a nova versão.`,
  },
  {
    titulo: '8. Contato',
    body: `Dúvidas sobre estes Termos podem ser enviadas pelos canais de suporte indicados dentro do aplicativo.`,
  },
];

export default function TelaTermosUso({ navigation }) {
  const { theme, rs } = usarTema();

  return (
    <ContenedorTela titulo="Termos de Uso" onBack={() => navigation.goBack()}>
      <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.xs), color: theme.textMuted, marginBottom: 18 }}>
        Versão {TERMS_VERSION} — atualizado em {new Date(TERMS_UPDATED_AT).toLocaleDateString('pt-BR')}
      </Text>

      {SECTIONS.map((s) => (
        <View key={s.titulo} style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: FONTES.bodyBold, fontSize: rs(TAMANHOS.base), color: theme.text, marginBottom: 8 }}>
            {s.titulo}
          </Text>
          <Text style={{ fontFamily: FONTES.body, fontSize: rs(TAMANHOS.sm), color: theme.textMuted, lineHeight: 21 }}>
            {s.body}
          </Text>
        </View>
      ))}
    </ContenedorTela>
  );
}
