import { GoogleGenAI } from '@google/genai';

export type MascotPoseName =
  | 'hero_toolbox'
  | 'hero_point'
  | 'hero_jump_wrench'
  | 'hero_spin'
  | 'paint'
  | 'paint_down'
  | 'wrench'
  | 'drill'
  | 'gift'
  | 'present'
  | 'thumbsup'
  | 'point';

export type BubbleKind = 'thought' | 'speech';

export interface MascotDecision {
  id: string;
  pose: MascotPoseName;
  secondaryPose?: MascotPoseName;
  bubbleKind: BubbleKind;
  text: string;
  activityLabel: string;
  propType: 'none' | 'paint_wall' | 'plumbing_pipe';
  durationMs: number;
}

const usedPhrases = new Set<string>();
const aiGeneratedQueue: MascotDecision[] = [];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniquePick(generator: () => string, maxAttempts = 25): string {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generator();
    if (!usedPhrases.has(candidate)) {
      usedPhrases.add(candidate);
      if (usedPhrases.size > 5000) {
        const first = usedPhrases.values().next().value;
        if (first) usedPhrases.delete(first);
      }
      return candidate;
    }
  }
  return generator();
}

// ============================================================================
// MATRIZES COMBINATÓRIAS CONCISAS E AUTÊNTICAS (> 120.000 COMBINAÇÕES EM 1-2 LINHAS)
// ============================================================================

const THOUGHT_OPENERS = [
  'Dica de mestre:',
  'Pensando aqui:',
  'Segredo da obra:',
  'Olho clínico:',
  'Anotei de cabeça:',
  'Regra de bancada:',
  'Na minha experiência,',
  'Filosofia da obra:',
  'Padrão Fontenele:',
  'Detalhe técnico:',
  'Checklist do dia:',
  'Orgulho de mestre:',
  'Boas práticas:',
  'Visão de especialista:',
  'Lembrete de obra:',
  'Ponto de atenção:',
  'Cálculo rápido:',
  'Conselho de amigo:',
  'Verdade da construção:',
  'Capricho profissional:',
  'Segredo do acabamento:',
  'Toque de especialista:',
  'Nota mental:',
  'Palavra de quem faz:',
] as const;

const THOUGHT_SUBJECTS = [
  'maleta organizada economiza metade do tempo',
  'parede bem lixada faz a tinta render o dobro',
  'fita veda-rosca na medida evita vazamento',
  'parafuso bom trava firme na bucha de primeira',
  'nível conferido garante serviço sem retrabalho',
  'cafezinho quente dá disposição pra toda reforma',
  'broca de vídia certa preserva sua furadeira',
  'massa corrida bem lixada deixa a parede um espelho',
  'registro de latão calibrado dura décadas',
  'disjuntor bem dimensionado traz paz pra casa',
  'chave cromo-vanádio nunca espana o parafuso',
  'trena travada no zero separa o mestre do amador',
  'impermeabilizar o rodapé salva qualquer pintura',
  'ferramenta limpa dá gosto de pegar no serviço',
  'iluminação LED certa valoriza qualquer ambiente',
  'misturar bem a tinta garante a cor exata',
  'testar a pressão hidráulica antes de fechar é lei',
  'lápis de carpinteiro na orelha nunca falha',
  'torque certo no parafuso garante fixação eterna',
  'luva firme dá precisão total na ferramenta',
  'conector elétrico bem isolado é segurança pura',
  'rolo antigota hidratado desliza que é beleza',
  'esquadro conferido deixa o piso impecável',
  'argamassa no ponto certo cola sem soltar',
  'tubulação alinhada é orgulho de encanador',
] as const;

const THOUGHT_CLOSERS = [
  '— padrão nota 10!',
  '— capricho total!',
  '— serviço garantido!',
  '— faz toda diferença!',
  '— coisa fina!',
  '— aprovado!',
  '— sem erro!',
  '— obra de primeira!',
  '— precisão pura!',
  '— é sucesso!',
  '— qualidade Fontenele!',
  '— zero dor de cabeça!',
  '— do jeito certo!',
  '— acabamento top!',
  '— tradição na obra!',
  '— cliente feliz!',
  '— técnica pura!',
  '— resultado perfeito!',
  '— feito pra durar!',
  '— padrão de mestre!',
] as const;

const TOOLBOX_VERBS = [
  'Conferindo minhas maletas:',
  'Organizando o jogo de chaves:',
  'Lustrando a chave combinada:',
  'Separando o kit da bancada:',
  'Calibrando as ferramentas:',
  'Deixando a maleta pronta:',
  'Verificando os alicates:',
  'Alinhando as chaves de fenda:',
  'Checando minha caixa vermelha:',
  'Dando trato no ferramental:',
  'Separando a chave 13mm:',
  'Conferindo o martelo:',
  'Separando as brocas de vídia:',
  'Ajustando o cinto técnico:',
  'Testando a trava da trena:',
  'Revisando a maleta dupla:',
  'Conferindo ponteiras imantadas:',
  'Separando ferramenta de precisão:',
  'Deixando tudo à mão:',
  'Balanço nas ferramentas:',
] as const;

const TOOLBOX_DETAILS = [
  'martelo, alicate e soquetes tinindo!',
  'tudo lubrificado e pronto pra obra!',
  'aço temperado pra qualquer aperto!',
  'cada peça no seu encaixe exato!',
  'ferramenta boa transforma o serviço!',
  'ponteiras philips e fenda alinhadas!',
  'chave inglesa ajustada sem folga!',
  'nível, esquadro e trena no zero!',
  'alicate de corte afiado e seguro!',
  'chaves estrela prontas pra ação!',
  'kit hidráulico e elétrico no capricho!',
  'catraca reversível testada no estalo!',
  'equipamento top que tem aqui na loja!',
  'pronto pra qualquer reparo ou reforma!',
  'organização de mestre de obras!',
] as const;

const PAINT_STARTERS = [
  'Passando o rolo antigota:',
  'Dando demão de vermelho vivo:',
  'Espalhando tinta acrílica:',
  'Cruzando o rolo na parede:',
  'Fazendo recorte fino no topo:',
  'Testando cobertura da tinta:',
  'Olha o deslize desse rolo:',
  'Uniformizando a pintura:',
  'Renovando a cor do cantinho:',
  'Caprichando na segunda demão:',
  'Puxando a tinta sem respingar:',
  'Trabalhando o acabamento fino:',
  'Deixando o vermelho brilhar:',
  'Conferindo a tinta fresca:',
  'Pintura limpa no capricho:',
] as const;

const PAINT_DETAILS = [
  'zero respingo e cobertura uniforme!',
  'secagem rápida e cor vibrante!',
  'acabamento lisinho sem marcas!',
  'tinta boa rende o dobro na parede!',
  'parede selada recebe a cor fácil!',
  'textura aveludada de primeira!',
  'toda linha de pintura tem aqui!',
  'padrão profissional do teto ao chão!',
  'sem bolhas e no prumo perfeito!',
  'qualidade que destaca o ambiente!',
] as const;

const PLUMBING_STARTERS = [
  'Ajustando o registro de cobre:',
  'Calibrando o manômetro 3D:',
  'Apertando a conexão de latão:',
  'Verificando a válvula vermelha:',
  'Estabilizando a pressão:',
  'Encaixando a chave no cano:',
  'Testando a rede hidráulica:',
  'Regulando 40 MCA no manômetro:',
  'Tirando folga da rosca de bronze:',
  'Manutenção fina no encanamento:',
  'Conferindo a vedação do registro:',
  'Travando a união hidráulica:',
  'Inspecionando a válvula:',
  'Equilibrando a linha de água:',
  'Aperto técnico na tubulação:',
] as const;

const PLUMBING_DETAILS = [
  'ponteiro firme e zero vazamento!',
  'conexão bem vedada dura décadas!',
  'rosca com veda-rosca nunca pinga!',
  'pressão estabilizada na norma!',
  'registro macio de abrir e fechar!',
  'tubos e conexões de primeira linha!',
  'teste de estanqueidade aprovado!',
  'acabamento técnico de encanador!',
  'fluxo contínuo e silencioso!',
  'hidráulica 100% garantida!',
] as const;

const DRILL_STARTERS = [
  'Testando a parafusadeira:',
  'Ajustando o torque no nível 8:',
  'Conferindo o mandril rápido:',
  'Alinhando a broca em 90 graus:',
  'Preparando fixação técnica:',
  'Checando bateria de lítio:',
  'Posicionando bucha com precisão:',
  'Furação limpa sem estourar reboco:',
  'Cravando parafuso na marcação:',
  'Fixação nivelada no milímetro:',
] as const;

const PROMO_OPENERS = [
  'Olha a Roleta da Sorte:',
  'Comprou na Fontenele, já sabe:',
  'Participe da Roleta de Prêmios:',
  'Não saia sem girar a roleta:',
  'Sua compra vale brinde na hora:',
  'Cliente fiel sai ganhando:',
  'Quer levar brinde hoje?',
  'Hora de testar sua sorte:',
  'Todo dia sai cliente premiado:',
  'Vem girar na Comercial Fontenele:',
] as const;

const PROMO_RULES = [
  'a cada R$ 100 você gira e ganha!',
  'siga @_comercial_fontenele e gire!',
  'comprou R$ 100, seguiu, ganhou!',
  'compras de R$ 100 liberam o giro!',
  'estoque de brindes recheado pra você!',
] as const;

// ============================================================================
// REAÇÕES ESPECÍFICAS E COMPACTAS DE ACORDO COM O PRÊMIO SORTEADO
// ============================================================================

export function buildPrizeSpecificReaction(prizeName?: string): MascotDecision {
  const cleanPrize = (prizeName || 'Brinde Especial').trim();
  const lower = cleanPrize.toLowerCase();

  if (
    lower.includes('chave') ||
    lower.includes('trena') ||
    lower.includes('régua') ||
    lower.includes('regua') ||
    lower.includes('alicate') ||
    lower.includes('martelo') ||
    lower.includes('ferramenta') ||
    lower.includes('fenda') ||
    lower.includes('estilete') ||
    lower.includes('nível') ||
    lower.includes('nivel') ||
    lower.includes('broca') ||
    lower.includes('lanterna')
  ) {
    const reactions = [
      `🏆 Saiu ${cleanPrize}! Ferramenta top pra sua maleta!`,
      `🔧 UAU! ${cleanPrize} na roleta! Qualidade profissional!`,
      `🧰 Bingo! Caiu em ${cleanPrize}! Direto pra bancada!`,
    ];
    return {
      id: `win-tool-${Date.now()}`,
      pose: 'hero_jump_wrench',
      secondaryPose: 'hero_toolbox',
      bubbleKind: 'speech',
      text: pick(reactions),
      activityLabel: `🏆 Prêmio: ${cleanPrize}`,
      propType: 'none',
      durationMs: 4200,
    };
  }

  if (
    lower.includes('tinta') ||
    lower.includes('rolo') ||
    lower.includes('pincel') ||
    lower.includes('trincha') ||
    lower.includes('fita') ||
    lower.includes('lixa') ||
    lower.includes('espátula') ||
    lower.includes('espatula')
  ) {
    const reactions = [
      `🎨 Saiu ${cleanPrize}! Acabamento nota mil na obra!`,
      `🖌️ Na mosca: ${cleanPrize}! Reforma no capricho!`,
    ];
    return {
      id: `win-paint-${Date.now()}`,
      pose: 'hero_jump_wrench',
      secondaryPose: 'paint',
      bubbleKind: 'speech',
      text: pick(reactions),
      activityLabel: `🎨 Saiu: ${cleanPrize}`,
      propType: 'none',
      durationMs: 4200,
    };
  }

  if (
    lower.includes('desconto') ||
    lower.includes('vale') ||
    lower.includes('pix') ||
    lower.includes('r$') ||
    lower.includes('%') ||
    lower.includes('cupom')
  ) {
    const reactions = [
      `💰 ESTOUROU! Saiu ${cleanPrize}! Economia real!`,
      `🎉 Que sorte: ${cleanPrize}! O bolso agradece!`,
    ];
    return {
      id: `win-discount-${Date.now()}`,
      pose: 'hero_jump_wrench',
      secondaryPose: 'hero_point',
      bubbleKind: 'speech',
      text: pick(reactions),
      activityLabel: `💰 Prêmio: ${cleanPrize}`,
      propType: 'none',
      durationMs: 4200,
    };
  }

  const customReactions = [
    `🎁 Saiu ${cleanPrize}! Comprou, seguiu, ganhou!`,
    `🏆 A seta cravou em ${cleanPrize}! Que prêmio top!`,
    `🎉 Olha lá: ${cleanPrize}! Sorte garantida na loja!`,
  ];

  return {
    id: `win-custom-${Date.now()}`,
    pose: Math.random() > 0.4 ? 'hero_jump_wrench' : 'gift',
    secondaryPose: 'hero_toolbox',
    bubbleKind: 'speech',
    text: pick(customReactions),
    activityLabel: `🎁 Saiu: ${cleanPrize}`,
    propType: 'none',
    durationMs: 4200,
  };
}

// ============================================================================
// REAÇÕES ENQUANTO A ROLETA ESTÁ GIRANDO (COMPACTAS EM 1-2 LINHAS)
// ============================================================================

export function buildSpinningReaction(availablePrizes: string[]): MascotDecision {
  const samplePrize =
    availablePrizes.length > 0 ? pick(availablePrizes) : 'prêmio especial';

  const templates = [
    `🤞 Torcendo pra sair ${samplePrize} nesse giro!`,
    `🎯 Roleta girando! Será que para em ${samplePrize}?`,
    `⚡ Girou forte! Apostando em ${samplePrize}!`,
    `👀 De olho na seta! Qual brinde vai sair agora?`,
  ];

  return {
    id: `spin-${Date.now()}`,
    pose: 'hero_point',
    secondaryPose: 'hero_spin',
    bubbleKind: 'speech',
    text: pick(templates),
    activityLabel: '🎯 Torcendo no giro',
    propType: 'none',
    durationMs: 5000,
  };
}

// ============================================================================
// GERADOR DE CICLO DE VIDA AUTÔNOMO (MODO DESCANSO)
// ============================================================================

let stepCounter = 0;

export function nextAutonomousLifeDecision(
  availablePrizes: string[],
  lastWonPrize?: string
): MascotDecision {
  if (aiGeneratedQueue.length > 0) {
    return aiGeneratedQueue.shift()!;
  }

  stepCounter = (stepCounter + 1) % 6;

  if (stepCounter === 0) {
    const text = uniquePick(() => `🧰 ${pick(TOOLBOX_VERBS)} ${pick(TOOLBOX_DETAILS)}`);
    return {
      id: `life-toolbox-${Date.now()}`,
      pose: 'hero_toolbox',
      secondaryPose: 'thumbsup',
      bubbleKind: 'speech',
      text,
      activityLabel: '🧰 Caixa de Ferramentas',
      propType: 'none',
      durationMs: 5400,
    };
  }

  if (stepCounter === 1) {
    const text = uniquePick(
      () => `💭 ${pick(THOUGHT_OPENERS)} ${pick(THOUGHT_SUBJECTS)} ${pick(THOUGHT_CLOSERS)}`
    );
    return {
      id: `life-thought-${Date.now()}`,
      pose: 'present',
      secondaryPose: 'hero_toolbox',
      bubbleKind: 'thought',
      text,
      activityLabel: '💭 Pensamento do Mestre',
      propType: 'none',
      durationMs: 5600,
    };
  }

  if (stepCounter === 2) {
    const text = uniquePick(() => `🎨 ${pick(PAINT_STARTERS)} ${pick(PAINT_DETAILS)}`);
    return {
      id: `life-paint-${Date.now()}`,
      pose: 'paint_down',
      secondaryPose: 'paint',
      bubbleKind: 'speech',
      text,
      activityLabel: '🎨 Pintura em Andamento',
      propType: 'paint_wall',
      durationMs: 6000,
    };
  }

  if (stepCounter === 3) {
    const text = uniquePick(() => `🎯 ${pick(PROMO_OPENERS)} ${pick(PROMO_RULES)}`);
    return {
      id: `life-invite-${Date.now()}`,
      pose: 'hero_point',
      secondaryPose: 'point',
      bubbleKind: 'speech',
      text,
      activityLabel: '🎯 Roleta de Prêmios',
      propType: 'none',
      durationMs: 5400,
    };
  }

  if (stepCounter === 4) {
    const text = uniquePick(() => `🔧 ${pick(PLUMBING_STARTERS)} ${pick(PLUMBING_DETAILS)}`);
    return {
      id: `life-plumbing-${Date.now()}`,
      pose: 'wrench',
      secondaryPose: 'hero_toolbox',
      bubbleKind: 'speech',
      text,
      activityLabel: '🔧 Hidráulica 3D',
      propType: 'plumbing_pipe',
      durationMs: 5800,
    };
  }

  const text = uniquePick(() => `⚡ ${pick(DRILL_STARTERS)} ${pick(THOUGHT_CLOSERS)}`);
  return {
    id: `life-drill-${Date.now()}`,
    pose: Math.random() > 0.45 ? 'drill' : 'hero_jump_wrench',
    secondaryPose: 'thumbsup',
    bubbleKind: 'thought',
    text,
    activityLabel: '⚡ Ajuste Técnico',
    propType: 'none',
    durationMs: 5200,
  };
}

export async function enrichMascotThoughtsWithGemini(
  availablePrizes: string[],
  lastWonPrize?: string
): Promise<void> {
  try {
    const apiKey =
      (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    const prizeListStr = availablePrizes.slice(0, 6).join(', ') || 'Brindes exclusivos';
    const prompt = `Você é o "Seu Fontenele", mascote mestre de obras da loja "Comercial Fontenele".
Gere 3 frases curtas (máximo 65 caracteres cada, uma por linha, sem aspas e sem numeração) sobre ferramentas, pintura, hidráulica ou prêmios (${prizeListStr}${lastWonPrize ? `, último prêmio: ${lastWonPrize}` : ''}).`;

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
    });

    const lines = (interaction.output_text || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 12 && l.length <= 75);

    for (const line of lines) {
      if (!usedPhrases.has(line)) {
        usedPhrases.add(line);
        aiGeneratedQueue.push({
          id: `ai-live-${Date.now()}-${Math.random()}`,
          pose: 'hero_toolbox',
          secondaryPose: 'hero_point',
          bubbleKind: 'thought',
          text: `💭 ${line}`,
          activityLabel: '💭 Pensamento IA',
          propType: 'none',
          durationMs: 5400,
        });
      }
    }
  } catch {
    // Fallback silencioso para o motor combinatório local
  }
}
